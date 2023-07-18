const multer = require("multer");

const path = require('path');

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