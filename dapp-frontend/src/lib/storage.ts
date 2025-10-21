import {Storage} from '@stacks/storage';
import { userSession } from './auth';

export const storage = new Storage({ userSession });1