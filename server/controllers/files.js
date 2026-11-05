import { getAllUserFiles, deleteVectors } from '../lib/pinecone.js';

export async function listFiles(req, res) {
  try {
    const userId = req.user.id;
    const data = await getAllUserFiles(userId);
    return res.json({ files: data.files, count: data.files.length, totalChunks: data.totalChunks });
  } catch (error) {
    console.error('Error getting user files:', error);
    return res.status(500).json({ error: `Failed to get files: ${error.message}` });
  }
}

export async function deleteFile(req, res) {
  try {
    const userId = req.user.id;
    const fileName = req.query.fileName;
    await deleteVectors(userId, fileName);
    return res.json({ success: true, message: `Successfully deleted file: ${fileName}` });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: `Failed to delete file: ${error.message}` });
  }
}
