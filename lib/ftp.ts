import * as ftp from "basic-ftp";
import { Readable } from "stream";
import { readFile, unlink } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const FTP_CONFIG = {
  host: process.env.FTP_IP || "",
  user: process.env.FTP_USER || "",
  password: process.env.FTP_PASSWORD || "",
  port: 21,
  timeout: 300000, // 5 minutes
};

const FTP_BASE_PATH =
  process.env.FTP_BASE_PATH || "/domains/pz22996.parspack.net/public_html";

export class FTPService {
  private static client: ftp.Client | null = null;

  private static async getClient(): Promise<ftp.Client> {
    if (this.client && !this.client.closed) {
      return this.client;
    }
    this.client = new ftp.Client();
    // basic-ftp default is 30 seconds. We enforce 5 minutes.
    // Setting before access
    // @ts-expect-error - timeout property is sometimes marked as read-only in type definitions
    this.client.ftp.timeout = FTP_CONFIG.timeout;

    // this.client.ftp.verbose = true;
    await this.client.access(FTP_CONFIG);

    // Set again after access just in case it was reset
    // @ts-expect-error - Ensure timeout is maintained after access
    this.client.ftp.timeout = FTP_CONFIG.timeout;

    return this.client;
  }

  private static getRemotePath(relativePath: string): string {
    // Ensure relativePath starts with / for joining
    const cleanPath = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${FTP_BASE_PATH}${cleanPath}`;
  }

  static async uploadBuffer(buffer: Buffer, relativePath: string) {
    const client = await this.getClient();
    const stream = Readable.from(buffer);
    const remotePath = this.getRemotePath(relativePath);

    const lastSlash = remotePath.lastIndexOf("/");
    const remoteDir = remotePath.substring(0, lastSlash) || "/";
    const filename = remotePath.substring(lastSlash + 1);

    console.log(FTP_CONFIG);

    console.log(
      `FTP: Uploading buffer to ${remotePath} (Dir: ${remoteDir}, File: ${filename})`
    );

    if (remoteDir) {
      await client.ensureDir(remoteDir);
    }
    await client.uploadFrom(stream, filename);
  }

  static async uploadFile(localPath: string, relativePath: string) {
    const client = await this.getClient();
    const remotePath = this.getRemotePath(relativePath);

    const lastSlash = remotePath.lastIndexOf("/");
    const remoteDir = remotePath.substring(0, lastSlash) || "/";
    const filename = remotePath.substring(lastSlash + 1);

    console.log(
      `FTP: Uploading file to ${remotePath} (Dir: ${remoteDir}, File: ${filename})`
    );

    if (remoteDir) {
      await client.ensureDir(remoteDir);
    }
    await client.uploadFrom(localPath, filename);
  }

  static async downloadToBuffer(relativePath: string): Promise<Buffer> {
    const tmpDir = path.join(process.cwd(), "public/assets/tmp");
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }
    const tmpFile = path.join(
      tmpDir,
      `tmp_dl_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    const client = await this.getClient();
    const remotePath = this.getRemotePath(relativePath);

    const lastSlash = remotePath.lastIndexOf("/");
    const remoteDir = remotePath.substring(0, lastSlash) || "/";
    const filename = remotePath.substring(lastSlash + 1);

    console.log(`FTP: Downloading ${remotePath} to buffer (via ${tmpFile})`);

    await client.ensureDir(remoteDir);
    await client.downloadTo(tmpFile, filename);
    const buffer = await readFile(tmpFile);
    await unlink(tmpFile);
    return buffer;
  }

  static async downloadToFile(relativePath: string, localPath: string) {
    const client = await this.getClient();
    const remotePath = this.getRemotePath(relativePath);

    const lastSlash = remotePath.lastIndexOf("/");
    const remoteDir = remotePath.substring(0, lastSlash) || "/";
    const filename = remotePath.substring(lastSlash + 1);

    console.log(`FTP: Downloading ${remotePath} to ${localPath}`);

    await client.ensureDir(remoteDir);
    await client.downloadTo(localPath, filename);
  }

  static async renameFile(oldRelativePath: string, newRelativePath: string) {
    const client = await this.getClient();
    const oldPath = this.getRemotePath(oldRelativePath);
    const newPath = this.getRemotePath(newRelativePath);

    console.log(`FTP: Renaming ${oldPath} to ${newPath}`);

    // For rename, it's often better to be absolute if supported, but let's see.
    // basic-ftp rename is just a wrapper around RNFR/RNTO
    await client.rename(oldPath, newPath);
  }

  static async deleteFile(relativePath: string) {
    const client = await this.getClient();
    const remotePath = this.getRemotePath(relativePath);
    try {
      await client.remove(remotePath);
    } catch (e) {
      console.error(`Failed to delete ${remotePath} on FTP:`, e);
    }
  }

  static async close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}
