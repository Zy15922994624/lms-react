export const UPLOAD = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  ACCEPTED_VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
  ACCEPTED_DOC: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
  ACCEPTED_IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const
