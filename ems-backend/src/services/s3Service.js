const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/aws");
const path = require("path");

class S3Service {
  async uploadFile(fileBuffer, fileName, contentType, folder = "protocols") {
    try {
      console.log("🔄 Starting S3 upload...");
      console.log("File name:", fileName);
      console.log("Content type:", contentType);
      console.log("Folder:", folder);
      console.log("Bucket:", bucketName);

      const timestamp = Date.now();
      const extension = path.extname(fileName);
      const uniqueFileName = `${folder}/${timestamp}-${path.basename(
        fileName,
        extension
      )}${extension}`;

      console.log("Unique file name:", uniqueFileName);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      });

      console.log("Sending to S3...");
      await s3Client.send(command);

      const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
      console.log("✅ S3 upload successful!");
      console.log("File URL:", fileUrl);

      return fileUrl;
    } catch (error) {
      console.error("❌ S3 upload error:", error);
      throw new Error("Failed to upload file to S3: " + error.message);
    }
  }

  async deleteFile(fileUrl) {
    try {
      // Extract key from URL
      const key = fileUrl.split(".amazonaws.com/")[1];
      if (!key) return;

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw new Error("Failed to delete file from S3");
    }
  }
}

module.exports = new S3Service();
