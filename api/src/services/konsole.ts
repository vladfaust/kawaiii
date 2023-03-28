import chalk from "chalk";

enum LogLevel {
  LOG = "L",
  WARN = "W",
  ERROR = "E",
}

function prefix(level: LogLevel): string {
  let s = `[${level}]`;
  s += `[${new Date().toISOString()}]`;

  switch (level) {
    case LogLevel.LOG:
      return chalk.blue(s + " ");
    case LogLevel.WARN:
      return chalk.yellow(s + " ");
    case LogLevel.ERROR:
      return chalk.red(s + " ");
  }
}

function log(message?: any, ...optionalParams: any[]): void {
  console.log(prefix(LogLevel.LOG) + message, ...optionalParams);
}

function warn(message?: any, ...optionalParams: any[]): void {
  console.warn(prefix(LogLevel.WARN) + message, ...optionalParams);
}

function error(message?: any, ...optionalParams: any[]): void {
  console.error(prefix(LogLevel.ERROR) + message, ...optionalParams);
}

const konsole = {
  log,
  warn,
  error,
};

export default konsole;
