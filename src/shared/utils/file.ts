// 共享文件工具：只保留和业务无关的纯文件处理能力
export class FileUtils {
  static encodeFileName(fileName: string): string {
    // eslint-disable-next-line no-control-regex
    if (/^[\x00-\x7F]*$/.test(fileName)) {
      return fileName
    }

    try {
      return encodeURIComponent(fileName)
    } catch (error) {
      console.warn('文件名编码失败', error)
      return fileName
    }
  }

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize
  }

  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || ''
  }
}
