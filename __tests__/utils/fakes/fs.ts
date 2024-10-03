import { Dirent, MakeDirectoryOptions, Mode, ObjectEncodingOptions, PathLike, PathOrFileDescriptor, WriteFileOptions, BigIntStats, Stats, StatSyncOptions } from "fs";

export default class FakeFs {
  private static paths: Record<string, Dirent[]> = {}
  private static data: Record<string, unknown> = { "package.json": JSON.stringify({ type: "module" }) }

  static readdirSync(path: PathLike, _options: BufferEncoding | { encoding?: BufferEncoding | null; withFileTypes?: boolean; recursive?: boolean | undefined; } | null | undefined): Dirent[] {
    console.log("Fake fs - readdirsync", path)
    return FakeFs.paths[path as string] ?? []
  }

  static mkdirSync(path: PathLike,
    _options?: MakeDirectoryOptions | Mode | null): string | undefined {
    console.log("Fake fs - mkdirsync", path)

    FakeFs.paths[path as string] = []
    return undefined
  }

  static writeFileSync(file: PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    _options?: WriteFileOptions): void {
    console.log("Fake fs - write file sync", file)

    const splitted = (file as string).split('/')
    const fileName = splitted[splitted.length - 1]
    const orgPath = splitted.slice(0, splitted.length - 1).join('/')

    FakeFs.data[fileName as string] = data
    if (!FakeFs.paths[orgPath as string]) FakeFs.paths[orgPath as string] = []
    FakeFs.paths[orgPath as string]!.push(fileName as unknown as Dirent)
  }

  static readFileSync(path: PathOrFileDescriptor, _options?: BufferEncoding | (ObjectEncodingOptions & { flag?: string | undefined; }) | null): string | Buffer {
    console.log("Fake fs - read file sync", path)

    const splitted = (path as string).split('/')
    const fileName = splitted[splitted.length - 1] as string

    const data = FakeFs.data[fileName]
    if (data === undefined) throw new Error("No file")

    return Buffer.from(
      typeof data === 'object' && !Array.isArray(data)
        ? JSON.stringify(data) : Array.isArray(data)
          ? data.toString() : data as string)
  }

  static existsSync(path: PathLike): boolean {
    return FakeFs.paths[path as string] !== undefined
  }

  static statSync(_path: PathLike, _options?: StatSyncOptions): Stats | BigIntStats | undefined {
    // @ts-expect-error
    return { size: 1 }
  }

  static clear(): void {
    FakeFs.paths = {}
    FakeFs.data = { "package.json": JSON.stringify({ type: "module" }) }
  }
}
