import path from 'node:path';
import { app } from 'electron';
import { getEnv } from '../shared/config';

const isPackaged = app.isPackaged;

const secretFileName = getEnv('VITE_ACTIVATION_FILE_PATH', 'activation-key.json');

export const VITE_ACTIVATION_FILE_PATH = isPackaged
    ? path.join(path.dirname(app.getAppPath()), secretFileName) // next to ASAR
    : path.join(process.cwd(), secretFileName);                 // dev root

// config.VITE_ACTIVATION_FILE_PATH = VITE_ACTIVATION_FILE_PATH;