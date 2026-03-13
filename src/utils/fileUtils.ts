/**
 * 文件处理工具类
 * 解决中文文件名编码问题
 */
export class FileUtils {
  /**
   * 创建编码安全的FormData
   * @param file 原始文件对象
   * @param additionalData 额外数据
   * @returns 编码安全的FormData
   */
  static createSafeFormData(file: File, additionalData: Record<string, any> = {}): FormData {
    const formData = new FormData();

    // 创建一个新的文件对象，确保文件名正确编码
    const encodedFileName = this.encodeFileName(file.name);
    const encodedFile = new File([file], encodedFileName, {
      type: file.type,
      lastModified: file.lastModified
    });

    formData.append('file', encodedFile);

    // 添加额外数据
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // 在FormData中额外存储原始文件名
    formData.append('originalFileName', file.name);

    return formData;
  }

  /**
   * 对文件名进行安全的URL编码
   * @param fileName 原始文件名
   * @returns 编码后的文件名
   */
  static encodeFileName(fileName: string): string {
    // 对于ASCII文件名，直接返回
    if (/^[\x00-\x7F]*$/.test(fileName)) {
      return fileName;
    }

    // 对于包含中文的文件名，使用安全的编码方式
    // 方案1: 使用encodeURIComponent
    try {
      return encodeURIComponent(fileName);
    } catch (error) {
      console.warn('文件名编码失败:', error);
      return fileName;
    }
  }

  /**
   * 验证文件类型
   * @param file 文件对象
   * @param allowedTypes 允许的文件类型
   * @returns 是否为允许的文件类型
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件大小
   * @param file 文件对象
   * @param maxSize 最大文件大小（字节）
   * @returns 是否在允许的大小范围内
   */
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * 获取文件扩展名
   * @param fileName 文件名
   * @returns 文件扩展名（小写）
   */
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * 根据文件类型自动判断资源类型
   * @param file 文件对象
   * @returns 资源类型
   */
  static getResourceType(file: File): string {
    const mimeType = file.type;
    const extension = this.getFileExtension(file.name);

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    }

    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'video';
    }

    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac'].includes(extension)) {
      return 'audio';
    }

    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return 'document';
    }

    return 'other';
  }
}
