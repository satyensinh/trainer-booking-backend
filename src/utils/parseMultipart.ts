import { APIGatewayProxyEvent } from 'aws-lambda';
import Busboy from 'busboy';

export async function parseMultipart(event: APIGatewayProxyEvent) {
  return new Promise<{
    fields: Record<string,string>;
    files: Record<string, { filename: string; content: Buffer }>;
  }>((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers as any });
    const fields: Record<string,string> = {};
    const files: Record<string, any> = {};

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const chunks: Buffer[] = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        files[fieldname] = {
          filename: info.filename,
          content: Buffer.concat(chunks)
        };
      });
    });

    busboy.on('finish', () => resolve({ fields, files }));
    busboy.on('error', err => reject(err));

    const buffer = Buffer.from(event.body!, 'base64');
    busboy.end(buffer);
  });
}
