import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
    /**
     * Upload a thumbnail image to Cloudinary
     */
    async uploadThumbnail(filePath: string, slug: string): Promise<{ url: string; publicId: string }> {
        const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
            folder: 'peanut-butter/thumbnails',
            public_id: slug,
            overwrite: true,
            resource_type: 'image',
        });

        // Clean up temp file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload a single HTML game file to Cloudinary (raw)
     */
    async uploadHtmlFile(filePath: string, slug: string): Promise<{ url: string; publicId: string }> {
        const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
            folder: `peanut-butter/games/${slug}`,
            public_id: 'index',
            overwrite: true,
            resource_type: 'raw',
        });

        // Clean up temp file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload all files from an extracted ZIP to Cloudinary
     * Returns the URL of the entry file (index.html)
     */
    async uploadGameFolder(
        gameDir: string,
        slug: string,
        entryFile: string,
    ): Promise<{ entryUrl: string; publicIds: string[] }> {
        const publicIds: string[] = [];
        const allFiles = this.getAllFiles(gameDir);

        let entryUrl = '';

        for (const absPath of allFiles) {
            const relativePath = path.relative(gameDir, absPath).replace(/\\/g, '/');
            const ext = path.extname(relativePath).toLowerCase();

            // Determine the public_id (without extension for Cloudinary)
            const publicIdBase = relativePath.replace(/\.[^.]+$/, '');
            const folder = `peanut-butter/games/${slug}`;

            const result: UploadApiResponse = await cloudinary.uploader.upload(absPath, {
                folder,
                public_id: publicIdBase,
                overwrite: true,
                resource_type: 'raw',
            });

            publicIds.push(result.public_id);

            if (relativePath === entryFile.replace(/\\/g, '/')) {
                entryUrl = result.secure_url;
            }
        }

        // Clean up local game directory
        if (fs.existsSync(gameDir)) {
            fs.rmSync(gameDir, { recursive: true, force: true });
        }

        return { entryUrl, publicIds };
    }

    /**
     * Delete a resource from Cloudinary by public ID
     */
    async deleteByPublicId(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            console.warn(`Failed to delete Cloudinary resource ${publicId}:`, error.message);
        }
    }

    /**
     * Delete multiple resources by public IDs
     */
    async deleteMultiple(publicIds: string[], resourceType: 'image' | 'raw' = 'raw'): Promise<void> {
        if (!publicIds || publicIds.length === 0) return;
        try {
            await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
        } catch (error) {
            console.warn(`Failed to delete Cloudinary resources:`, error.message);
        }
    }

    /**
     * Delete all resources in a folder
     */
    async deleteFolder(folderPath: string): Promise<void> {
        try {
            await cloudinary.api.delete_resources_by_prefix(folderPath, { resource_type: 'raw' });
            await cloudinary.api.delete_folder(folderPath);
        } catch (error) {
            console.warn(`Failed to delete Cloudinary folder ${folderPath}:`, error.message);
        }
    }

    /**
     * Recursively get all files in a directory
     */
    private getAllFiles(dir: string): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        }
        return files;
    }
}
