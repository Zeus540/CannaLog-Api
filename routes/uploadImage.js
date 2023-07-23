const express = require('express')
const router = express.Router();
const upload = require("../middleware/uploadImage")
const sharp = require('sharp');
const { createPool } = require('mysql')
const fs = require('fs');

var Minio = require("minio");

const db = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SWEETLEAF,
    connectionLimit: 1000,
});


var minioClient = new Minio.Client({
    endPoint: 'https://minio.cannalog.co.za',
    port: 9995,
    useSSL: false,
    accessKey: 'SweetLeaf',
    secretKey: 'Cheezy540!'
});

const uploadToMinio = async (path, name) => {
    console.log("uploadToMinio")

    return new Promise((resolve, reject) => {

        minioClient.fPutObject('sweetleaf', name, path, function (err, file) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

const deleteFile = async (path) => {
    try {
        await fs.unlinkSync(path)
    } catch (error) {
        console.log("error", error)
    }
}


const resizeAndUploadImage = async (originalPath, originalFileName, sizes, formats) => {
    console.log("resizeAndUploadImage")
    try {
        for (const format of formats) {
            let originalFileNameFull = "full-" + originalFileName.split(".")[0] + "." + format

            let sharpObject = sharp(originalPath)
            if (format === "webp") {

                await sharpObject
                    .rotate() // Keep the image rotation
                    .toFormat(format)
                    .webp({ quality: 40, reductionEffort: 80, }) // Adjust the quality value as desired (0-100)
                    .toFile("./tmp/" + originalFileNameFull);

            } else if (format === "jpg") {
                await sharpObject
                    .rotate() // Keep the image rotation
                    .toFormat(format)
                    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Specify the background color as desired (white in this example)
                    .jpeg({ quality: 50 }) // Adjust the quality value as desired (0-100)
                    .toFile("./tmp/" + originalFileNameFull);
            }

            await uploadToMinio("./tmp/" + originalFileNameFull, originalFileNameFull)

            await deleteFile("./tmp/" + originalFileNameFull)
        }

        for (const size of sizes) {
            for (const format of formats) {
                let ResizedFileName = size.width + "x" + size.height + "-" + originalFileName.split(".")[0] + "." + format

                let sharpObject = sharp(originalPath)

                if (size.width !== undefined && size.height !== undefined) {
                    await sharpObject
                        .resize(size.width, size.height, {
                            kernel: sharp.kernel.nearest,
                            fit: 'cover',
                            position: 'center',
                        })
                        .toFormat(format)
                        .toFile("./tmp/" + ResizedFileName)
                }


                await uploadToMinio("./tmp/" + ResizedFileName, ResizedFileName)

                await deleteFile("./tmp/" + ResizedFileName)
            }
        }

        await deleteFile("./tmp/" + originalFileName)
    } catch (error) {
        console.log("error", error)
    }
}

router.post('/upload_image', upload.single("file"), async (req, res) => {

    let originalPath = req.file.path
    let originalFileName = req.file.filename

    console.log("upload_image")

    let sizes = [
        { width: 500, height: 500 },
        { width: 768, height: 600 },
    ]

    let formats = ["webp", "jpg"]


    try {
        await resizeAndUploadImage(originalPath, originalFileName, sizes, formats)
        let path = "http://s3.cannalog.co.za/sweetleaf/"

        let nexGen = originalFileName.split(".")[0]

        sqlInsertPlantData = `INSERT INTO Diary_Images (Image,ImageNextGen,ImageThumbnail,ImageThumbnailNextGen,CoverImage,CoverImageNextGen,DayId, WeekId, DiaryId) VALUES ("http://s3.cannalog.co.za/sweetleaf/${"full-" + originalFileName}","http://s3.cannalog.co.za/sweetleaf/${"full-" + nexGen + ".webp"}","http://s3.cannalog.co.za/sweetleaf/${sizes[0].width + "x" + sizes[0].height + "-" + originalFileName}","http://s3.cannalog.co.za/sweetleaf/${sizes[0].width + "x" + sizes[0].height + "-" + nexGen + ".webp"}","http://s3.cannalog.co.za/sweetleaf/${sizes[1].width + "x" + sizes[1].height + "-" + originalFileName}","http://s3.cannalog.co.za/sweetleaf/${sizes[1].width + "x" + sizes[1].height + "-" + nexGen + ".webp"}",581,567,284)`

        await db.query(sqlInsertPlantData, (err, result, fields) => {
            if (err) {
                console.log(err)
            } else {
               
                res.end(`Image Uploaded Successfully`)
            }
        });

  
    } catch (error) {

        console.log("error", error)
        res.status(500).json({ error: "Image upload failed" })
    }

})



module.exports = router;
