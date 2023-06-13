"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    /**
     * Creates a new Promise object if the input value is not already a Promise.
     * @param {any} value - The value to be adopted as a Promise.
     * @returns {Promise} - A Promise object.
     */
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        /**
         * Executes the next step of a generator function with the provided value and catches any errors thrown.
         * @param {*} value - The value to pass to the generator function.
         * @remarks This function is typically used in conjunction with a generator function and the Promise constructor to create a promise-based asynchronous control flow.
         */
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        /**
         * A helper function for handling rejected promises.
         * @param {any} value - The value to be thrown as a rejection reason.
         */
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        /**
         * Resolves or adopts a Promise based on the result of a function.
         * @param {Object} result - The result of a function.
         * @param {boolean} result.done - Indicates if the function has completed.
         * @param {*} result.value - The value returned by the function.
         * @returns {Promise} - A Promise that resolves or adopts the result of the function.
         */
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const RunActionStep_1 = require("./src/RunActionStep");
console.log(`Running the test!`);
process.env['GITHUB_WORKSPACE'] = path.join(__dirname, './samples');
console.log(`Working in repo at: ${process.env['GITHUB_WORKSPACE']}`);
/**
 * Executes the Go function asynchronously.
 * @returns {Promise<void>} A Promise that resolves when the RunActionStep function is completed.
 */
function Go() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, RunActionStep_1.RunActionStep)();
    });
}
Go();
