var Minio = require("minio");
const multer = require("multer");

const path = require('path');

var minioClient = new Minio.Client({
    endPoint: 'minio.s3.sweetleaf.co.za',
    port: 9995,
    useSSL: false,
    accessKey: 'SweetLeaf',
    secretKey: 'Cheezy540!'
});

const getImage = (req,res,next)=>{
  
    minioClient.fPutObject('sweetleaf', '20230612_101433~2.jpg', './tmp/photo.jpg', function(err,file) {
        if (err) {
          return console.log(err)
        }
        console.log('success')
        console.log('file',file)
      })

    
}

let temp_path = "./tmp"

const storage = multer.diskStorage({
  destination:function (req,file,cb) {
   
    cb(null,temp_path)
  },
  filename:function (req,file,cb){
  
    let newName = Date.now() +  path.extname(file.originalname)
    cb(null,newName)

}
})

const upload = new multer({storage})

module.exports = upload