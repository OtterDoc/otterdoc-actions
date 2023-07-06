#!/usr/bin/env ts-node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, './.env') });
const RunActionStep_1 = require("./src/RunActionStep");
const commander_1 = require("commander");
commander_1.program
    .name('OtterDoc CLI')
    .description('OtterDoc Command Line Interface')
    .version('1.0.0')
    .argument('<path>', 'path to the repository to comment');
// program
//   .command('document')
//   .description('Comment a local repository')
//   .argument('<path>', 'path to the repository to comment')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined
//     console.log(str.split(options.separator, limit))
//   })
commander_1.program.parse();
const key = process.env['OTTERDOC_KEY'];
if (!key) {
    console.error('No API key found. Please add "OTTERDOC_KEY=XXXX" to .env');
    process.exit(1);
}
const pathToDocument = commander_1.program.args[0];
process.env['GITHUB_WORKSPACE'] = path_1.default.join(__dirname, pathToDocument);
// process.env['INPUT_INCLUDEFILES'] = 'sample.ts'
console.log(`Working in repo at: ${process.env['GITHUB_WORKSPACE']}`);
console.log(`Included File Filter: ${process.env['INPUT_INCLUDEFILES']}`);
/**
 * Executes the Go function asynchronously.
 * @async
 * @function
 * @returns {void}
 */
function Go() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, RunActionStep_1.RunActionStep)();
    });
}
Go();
