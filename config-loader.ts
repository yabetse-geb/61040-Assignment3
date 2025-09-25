/**
 * Configuration management for the Gemini Schedule Demo
 * 
 * This module handles loading the API key and other configuration
 * from external files, with proper error handling.
 */

import * as path from 'path';
import { Config } from './types';

/**
 * Load the API key from the config.json file
 * Handles both development (ts-node) and production (compiled) paths
 */
export function loadApiKey(): string {
    try {
        // Handle both development (ts-node) and production (compiled) paths
        const configPath: string = __dirname.includes('dist') 
            ? path.join(__dirname, '..', 'config.json')
            : path.join(__dirname, 'config.json');
        
        const config: Config = require(configPath);
        
        if (!config.apiKey) {
            throw new Error('API key not found in config file');
        }
        
        return config.apiKey;
    } catch (error) {
        console.error('❌ Error: Could not load config.json file.');
        console.error('Please make sure you have created config.json with your Gemini API key.');
        console.error('See README.md for instructions.');
        process.exit(1);
    }
}
