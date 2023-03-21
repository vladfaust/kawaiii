import { gql } from "@urql/core";
import offchainCafe from "@/services/offchainCafe";
import { KawaiiiCollectible__factory } from "@kawaiii/contracts/typechain";
import {
  TransferSingleEvent,
  TransferBatchEvent,
  CreateEvent,
  MintEvent,
} from "@kawaiii/contracts/typechain/contracts/Collectible.sol/KawaiiiCollectible";
import config from "./config";
import { toBuffer, toHex } from "./utils";
import { BigNumber, ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import * as wonka from "wonka";

type Log = {
  block: {
    number: number;
    timestamp: number;
  };
  logIndex: number;
  transaction: {
    hash: string;
  };
  data: string;
  topics: string[];
};

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
  collectibleId: Buffer;
};

type CollectibleMintEventData = BaseEvent & {
  /** Database user ID. */
  toId: string;

  /** Database collectible ID. */
  collectibleId: Buffer;

  amount: bigint;
  income: bigint;
  ownerFee: bigint;
  profit: bigint;
};

type CollectibleTransferEventData = BaseEvent & {
  /** Database user ID. */
  fromId?: string;

  /** Database user ID. */
  toId?: string;

  /** Database collectible ID. */
  collectibleId: Buffer;

  subIndex: number;
  value: bigint;
};

const LATEST_BLOCK_GQL = gql`
  query {
    meta {
      chain {
        latestBlock {
          number
        }
      }
    }
  }
`;

async function ensureUser(address: string): Promise<string> {
  const evmAddress = toBuffer(address);

  // const user = await prisma.$transaction(async (prisma) => {
  //   let user = await prisma.user.findUnique({
  //     where: { evmAddress },
  //     select: { id: true },
  //   });

  //   if (!user) {
  //     user = await prisma.user.create({
  //       data: {
  //         id: nanoid(),
  //         evmAddress,
  //       },
  //       select: { id: true },
  //     });
  //   }

  //   return user;
  // });

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

function logsGql(topic: string) {
  return gql`query ContractLogs(
    $fromBlock: Int!,
    $toBlock: Int!
  ) {
    contract(address: "${toHex(config.eth.collectibleContractAddress)}") {
      logs(
        topics: [["${topic}"]],
        limit: 10,
        fromBlock: $fromBlock,
        toBlock: $toBlock
      ) {
          block {
            number
            timestamp
          }
          logIndex
          transaction {
            hash
          }
          data
          topics
      }
    }
  }`;
}

function subscriptionGql(topic: string) {
  return gql`
    subscription {
      log(
        contractAddress: "${toHex(config.eth.collectibleContractAddress)}",
        topics: [["${topic}"]]
      ) {
        block {
          number
          timestamp
        }
        logIndex
        transaction {
          hash
        }
        data
        topics
      }
    }`;
}

const iface = KawaiiiCollectible__factory.createInterface();
const prisma = new PrismaClient();

const latestChainBlockNumber = (
  await offchainCafe.query(LATEST_BLOCK_GQL, {}).toPromise()
).data.meta.chain.latestBlock.number as number;

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

    const logs: Log[] = (
      await offchainCafe
        .query(logsGql(topic), {
          fromBlock,
          toBlock: latestChainBlockNumber,
        })
        .toPromise()
    ).data.contract.logs;

    if (!logs.length) {
      console.log("No historical logs found");
      break;
    }

    // Filter out repeated logs.
    if (
      !logs.find(
        (l) =>
          l.block.number != fromBlock ||
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
      // await prisma.onChainEnergyPurchase.createMany({
      //   data: events,
      //   skipDuplicates: true,
      // });

      latestEventBlockNumber = events[events.length - 1].blockNumber;
    }

    fromBlock = logs[logs.length - 1].block.number;

    logIndicesFromTheLatestBlock = logs
      .filter((l) => l.block.number == fromBlock)
      .map((l) => l.logIndex);
  }
}

async function subscribeToRealtimeEvents<T>(
  topic: string,
  logMapFn: (log: Log) => Promise<T[]>,
  createManyFn: (events: T[]) => Promise<void>
) {
  const { unsubscribe } = wonka.pipe(
    offchainCafe.subscription(subscriptionGql(topic), {}),
    wonka.subscribe(async (result) => {
      const log: Log | undefined = result.data?.log;
      if (!log) throw new Error("No data received");

      const events = await logMapFn(log);
      if (events.length) {
        console.log(`Saving realtime events`, events);
        createManyFn(events);
      }
    })
  );

  return unsubscribe;
}

async function syncCreateEvents() {
  const logMapFn = async (log: Log) => {
    const parsed = iface.parseLog(log) as unknown as CreateEvent;

    return [
      {
        creatorId: await ensureUser(parsed.args.creator),
        collectibleId: toBuffer(parsed.args.tokenId),
        blockNumber: log.block.number,
        logIndex: log.logIndex,
        txHash: log.transaction.hash,
        createdAt: new Date(log.block.timestamp * 1000),
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
    )?.blockNumber ?? 0;

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
        collectibleId: toBuffer(parsed.args.tokenId),
        blockNumber: log.block.number,
        logIndex: log.logIndex,
        txHash: log.transaction.hash,
        amount: parsed.args.amount.toBigInt(),
        income: parsed.args.income.toBigInt(),
        ownerFee: parsed.args.ownerFee.toBigInt(),
        profit: parsed.args.profit.toBigInt(),
        createdAt: new Date(log.block.timestamp * 1000),
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
    )?.blockNumber ?? 0;

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
              increment: event.value,
            },
          },
          create: {
            userId: event.toId,
            collectibleId: event.collectibleId,
            balance: event.value,
          },
        });
      }

      if (event.fromId) {
        await prisma.collectibleBalance.upsert({
          where: {
            userId_collectibleId: {
              userId: event.fromId,
              collectibleId: event.collectibleId,
            },
          },
          update: {
            balance: {
              decrement: event.value,
            },
          },
          create: {
            userId: event.fromId,
            collectibleId: event.collectibleId,
            balance: -event.value,
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
        collectibleId: toBuffer(parsed.args.id),
        blockNumber: log.block.number,
        logIndex: log.logIndex,
        subIndex: 0,
        txHash: log.transaction.hash,
        value: parsed.args.value.toBigInt(),
        createdAt: new Date(log.block.timestamp * 1000),
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
    )?.blockNumber ?? 0;

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
        collectibleId: toBuffer(id),
        blockNumber: log.block.number,
        logIndex: log.logIndex,
        subIndex: index,
        txHash: log.transaction.hash,
        value: parsed.args.values[index].toBigInt(),
        createdAt: new Date(log.block.timestamp * 1000),
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
    )?.blockNumber ?? 0;

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
