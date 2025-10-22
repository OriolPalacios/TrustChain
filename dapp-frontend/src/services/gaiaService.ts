// src/services/gaiaService.ts
import { Storage } from '@stacks/storage';
import { userSession } from './userSessionService'; // <-- ¡IMPORTACIÓN CORREGIDA!

const storage = new Storage({ userSession });

/**
 * Sube un archivo a Gaia y devuelve la URL pública
 */
export const uploadFileToGaia = async (file: File) => {
  const fileName = `${new Date().getTime()}-${file.name}`;
  try {
    const fileUrl = await storage.putFile(fileName, file, {
      encrypt: false,
    });
    console.log('Archivo subido a Gaia:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error subiendo a Gaia:', error);
    return null;
  }
};

/**
 * Obtiene un archivo de Gaia
 */
export const getFileFromGaia = async (fileName: string) => {
  try {
    const file = await storage.getFile(fileName, {
      decrypt: false,
    });
    return file;
  } catch (error) {
    console.error('Error obteniendo de Gaia:', error);
    return null;
  }
};