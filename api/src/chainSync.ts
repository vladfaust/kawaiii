import { KawaiiiCollectible__factory } from "@kawaiiico/contracts/typechain";
import {
  TransferSingleEvent,
  TransferBatchEvent,
  CreateEvent,
  MintEvent,
} from "@kawaiiico/contracts/typechain/contracts/Collectible.sol/KawaiiiCollectible";
import config from "./config";
import { toBuffer, toHex } from "./utils";
import { BigNumber, ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { httpProvider, wsProvider } from "./services/eth";
import redis from "@/services/redis";

type Log = ethers.providers.Log;

type BaseEvent = {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  createdAt: Date;
};

type CollectibleCreateEventData = BaseEvent & {
  /** Database user ID. */
  creatorId: string;

  /** Database collectible ID. */
  collectibleId: string;
};

type CollectibleMintEventData = BaseEvent & {
  /** Database user ID. */
  toId: string;

  /** Database collectible ID. */
  collectibleId: string;

  amount: Buffer;
  income: Buffer;
  ownerFee: Buffer;
  profit: Buffer;
};

type CollectibleTransferEventData = BaseEvent & {
  /** Database user ID. */
  fromId?: string;

  /** Database user ID. */
  toId?: string;

  /** Database collectible ID. */
  collectibleId: string;

  subIndex: number;
  value: Buffer;
};

async function blockTimestamp(blockNumber: number): Promise<Date> {
  const cachedTimestamp = await redis.get(`block:${blockNumber}:timestamp`);

  if (cachedTimestamp) {
    return new Date(parseInt(cachedTimestamp) * 1000);
  } else {
    const block = await httpProvider.getBlock(blockNumber);
    const timestamp = block.timestamp;
    await redis.set(`block:${blockNumber}:timestamp`, timestamp);
    return new Date(timestamp * 1000);
  }
}

async function ensureUser(address: string): Promise<string> {
  const evmAddress = toBuffer(address);

  // FIXME: Turn it into a transaction.
  try {
    const user = await prisma.user.upsert({
      where: { evmAddress },
      update: {},
      create: {
        id: nanoid(),
        evmAddress,
      },
    });

    return user.id;
  } catch (e) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { evmAddress },
    });

    return user.id;
  }
}

const BATCH_LIMIT = 10000;

const iface = KawaiiiCollectible__factory.createInterface();
const prisma = new PrismaClient();

const latestChainBlockNumber = await httpProvider.getBlockNumber();

async function syncHistoricalEvents<T extends BaseEvent>(
  topic: string,
  latestEventBlockNumber: number,
  logMapFn: (log: Log) => Promise<T[]>,
  createManyFn: (events: T[]) => Promise<void>
) {
  let fromBlock = latestEventBlockNumber;
  let logIndicesFromTheLatestBlock: number[] = [];

  // Query for all contract logs from the latest block to the current block.
  while (fromBlock < latestChainBlockNumber) {
    console.log(`Querying historical logs from block ${fromBlock}`);

    const logs = await httpProvider.getLogs({
      fromBlock,
      toBlock: Math.min(latestChainBlockNumber, fromBlock + BATCH_LIMIT),
      address: toHex(config.eth.collectibleContractAddress),
      topics: [[topic]],
    });

    if (!logs.length) {
      console.log("No historical logs found");
      break;
    }

    // Filter out repeated logs.
    if (
      !logs.find(
        (l) =>
          l.blockNumber != fromBlock ||
          !logIndicesFromTheLatestBlock.includes(l.logIndex)
      )
    ) {
      console.log("No new historical logs found");
      break;
    }

    const events = (await Promise.all(logs.map(logMapFn)))
      .flat()
      .filter((x) => x) as T[];

    if (events.length) {
      console.log(`Saving ${events.length} historical events`, events);
      await createManyFn(events);
      latestEventBlockNumber = events[events.length - 1].blockNumber;
    }

    fromBlock = logs[logs.length - 1].blockNumber;

    logIndicesFromTheLatestBlock = logs
      .filter((l) => l.blockNumber == fromBlock)
      .map((l) => l.logIndex);
  }
}

async function subscribeToRealtimeEvents<T>(
  topic: string,
  logMapFn: (log: Log) => Promise<T[]>,
  createManyFn: (events: T[]) => Promise<void>
) {
  wsProvider.on(
    { address: toHex(config.eth.collectibleContractAddress), topics: [topic] },
    async (log) => {
      const events = await logMapFn(log);

      if (events.length) {
        console.log(`Saving ${events.length} realtime events`, events);
        await createManyFn(events);
      }
    }
  );

  return () => {
    wsProvider.off({
      address: toHex(config.eth.collectibleContractAddress),
      topics: [topic],
    });
  };
}

async function syncCreateEvents() {
  const logMapFn = async (log: Log) => {
    const parsed = iface.parseLog(log) as unknown as CreateEvent;

    return [
      {
        creatorId: await ensureUser(parsed.args.creator),
        collectibleId: toHex(parsed.args.tokenId),
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        txHash: log.transactionHash,
        createdAt: await blockTimestamp(log.blockNumber),
      },
    ];
  };

  const createManyFn = async (events: CollectibleCreateEventData[]) => {
    await prisma.collectibleCreateEvent.createMany({
      data: events,
      skipDuplicates: true,
    });
  };

  const unbsubscribe = subscribeToRealtimeEvents<CollectibleCreateEventData>(
    iface.getEventTopic("Create"),
    logMapFn,
    createManyFn
  );

  let latestEventBlock =
    (
      await prisma.collectibleCreateEvent.findFirst({
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      })
    )?.blockNumber ?? config.eth.collectibleContractDeployBlockNumber;

  await syncHistoricalEvents<CollectibleCreateEventData>(
    iface.getEventTopic("Create"),
    latestEventBlock,
    logMapFn,
    createManyFn
  );

  return unbsubscribe;
}

async function syncMintEvents() {
  const logMapFn = async (log: Log) => {
    const parsed = iface.parseLog(log) as unknown as MintEvent;

    return [
      {
        toId: await ensureUser(parsed.args.to),
        collectibleId: toHex(parsed.args.tokenId),
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        txHash: log.transactionHash,
        amount: toBuffer(parsed.args.amount),
        income: toBuffer(parsed.args.income),
        ownerFee: toBuffer(parsed.args.ownerFee),
        profit: toBuffer(parsed.args.profit),
        createdAt: await blockTimestamp(log.blockNumber),
      },
    ];
  };

  const createManyFn = async (events: CollectibleMintEventData[]) => {
    await prisma.collectibleMintEvent.createMany({
      data: events,
      skipDuplicates: true,
    });
  };

  const unbsubscribe = subscribeToRealtimeEvents<CollectibleMintEventData>(
    iface.getEventTopic("Mint"),
    logMapFn,
    createManyFn
  );

  let latestEventBlock =
    (
      await prisma.collectibleMintEvent.findFirst({
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      })
    )?.blockNumber ?? config.eth.collectibleContractDeployBlockNumber;

  await syncHistoricalEvents<CollectibleMintEventData>(
    iface.getEventTopic("Mint"),
    latestEventBlock,
    logMapFn,
    createManyFn
  );

  return unbsubscribe;
}

async function insertTransferEvent(event: CollectibleTransferEventData) {
  await prisma.$transaction(async (prisma) => {
    const found = await prisma.collectibleTransferEvent.findUnique({
      where: {
        blockNumber_logIndex_subIndex: {
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
          subIndex: event.subIndex,
        },
      },
    });

    if (!found) {
      await prisma.collectibleTransferEvent.create({
        data: event,
      });

      if (event.toId) {
        await prisma.collectibleBalance.upsert({
          where: {
            userId_collectibleId: {
              userId: event.toId,
              collectibleId: event.collectibleId,
            },
          },
          update: {
            balance: {
              increment: BigNumber.from(event.value).toNumber(),
            },
          },
          create: {
            userId: event.toId,
            collectibleId: event.collectibleId,
            balance: BigNumber.from(event.value).toNumber(),
          },
        });
      }

      if (event.fromId) {
        await prisma.collectibleBalance.upsert({
          where: {
            userId_collectibleId: {
              userId: event.fromId,
              collectibleId: toHex(event.collectibleId),
            },
          },
          update: {
            balance: {
              decrement: BigNumber.from(event.value).toNumber(),
            },
          },
          create: {
            userId: event.fromId,
            collectibleId: toHex(event.collectibleId),
            balance: -BigNumber.from(event.value).toNumber(),
          },
        });
      }
    }
  });
}

async function syncTransferSingleEvents() {
  const logMapFn = async (log: Log) => {
    const parsed = iface.parseLog(log) as unknown as TransferSingleEvent;

    return [
      {
        fromId:
          parsed.args.from != ethers.constants.AddressZero
            ? await ensureUser(parsed.args.from)
            : undefined,
        toId:
          parsed.args.to != ethers.constants.AddressZero
            ? await ensureUser(parsed.args.to)
            : undefined,
        collectibleId: toHex(parsed.args.id),
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        subIndex: 0,
        txHash: log.transactionHash,
        value: toBuffer(parsed.args.value),
        createdAt: await blockTimestamp(log.blockNumber),
      },
    ];
  };

  const createManyFn = async (events: CollectibleTransferEventData[]) => {
    for (const event of events) {
      await insertTransferEvent(event);
    }
  };

  const unbsubscribe = subscribeToRealtimeEvents<CollectibleTransferEventData>(
    iface.getEventTopic("TransferSingle"),
    logMapFn,
    createManyFn
  );

  let latestEventBlock =
    (
      await prisma.collectibleTransferEvent.findFirst({
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      })
    )?.blockNumber ?? config.eth.collectibleContractDeployBlockNumber;

  await syncHistoricalEvents<CollectibleTransferEventData>(
    iface.getEventTopic("TransferSingle"),
    latestEventBlock,
    logMapFn,
    createManyFn
  );

  return unbsubscribe;
}

async function syncTransferBatchEvents() {
  const logMapFn = async (log: Log) => {
    const parsed = iface.parseLog(log) as unknown as TransferBatchEvent;

    return Promise.all(
      parsed.args.ids.map(async (id: BigNumber, index: number) => ({
        fromId:
          parsed.args.from != ethers.constants.AddressZero
            ? await ensureUser(parsed.args.from)
            : undefined,
        toId:
          parsed.args.to != ethers.constants.AddressZero
            ? await ensureUser(parsed.args.to)
            : undefined,
        collectibleId: toHex(id),
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        subIndex: index,
        txHash: log.transactionHash,
        value: toBuffer(parsed.args.values[index]),
        createdAt: await blockTimestamp(log.blockNumber),
      }))
    );
  };

  const createManyFn = async (events: CollectibleTransferEventData[]) => {
    for (const event of events) {
      await insertTransferEvent(event);
    }
  };

  const unbsubscribe = subscribeToRealtimeEvents<CollectibleTransferEventData>(
    iface.getEventTopic("TransferBatch"),
    logMapFn,
    createManyFn
  );

  let latestEventBlock =
    (
      await prisma.collectibleTransferEvent.findFirst({
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      })
    )?.blockNumber ?? config.eth.collectibleContractDeployBlockNumber;

  await syncHistoricalEvents<CollectibleTransferEventData>(
    iface.getEventTopic("TransferBatch"),
    latestEventBlock,
    logMapFn,
    createManyFn
  );

  return unbsubscribe;
}

export async function sync() {
  await syncCreateEvents();
  await syncMintEvents();
  await syncTransferSingleEvents();
  await syncTransferBatchEvents();
}
