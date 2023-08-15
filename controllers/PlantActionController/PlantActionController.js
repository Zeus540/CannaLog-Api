const db = require('../../lib/db')
const { formatToTimeZone } = require('date-fns-timezone');
const { rollback, commit, releaseConnectionAndRespond } = require('../../lib/db_helper')
require('dotenv').config()

var Minio = require("minio");

const sharp = require('sharp');
const fs = require('fs');

var minioClient = new Minio.Client({
  endPoint: 'minio.cannalog.co.za',
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
                  .withMetadata() 
                  .toFormat(format)
                  .webp({ quality: 40, reductionEffort: 80, }) // Adjust the quality value as desired (0-100)
                  .toFile("./tmp/" + originalFileNameFull);

          } else if (format === "jpg") {
              await sharpObject
                  .rotate() // Keep the image rotation
                  .withMetadata() 
                  .toFormat(format)
                  .flatten({ background: { r: 255, g: 255, b: 255 } }) // Specify the background color as desired (white in this example)
                  .jpeg({ quality: 50 }) // Adjust the quality value as desired (0-100)
                  .toFile("./tmp/" + originalFileNameFull);
          }else if (format === "png") {
            await sharpObject
                .rotate() // Keep the image rotation
                .withMetadata() 
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
                      .withMetadata()
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

module.exports = {
  get: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    let sql = `
    SELECT plant_action_types.plant_action_type_name, plant_actions.plant_action_id,plant_actions.plant_id,DATE_FORMAT(plant_actions.creation_date, "%Y-%m-%dT%H:%i:%sZ") creation_date,plant_actions.plant_action_type_id
    FROM plant_action_types
    JOIN plant_actions ON plant_action_types.plant_action_type_id = plant_actions.plant_action_type_id

    WHERE plant_actions.plant_id = ?
    ORDER BY plant_actions.creation_date DESC
        `

    db.query(sql, [req.body.plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getActionTypes: (req, res) => {
    /* ...
    // #swagger.tags = ['Plant Actions']
    ...
    */
    let sql = `
    SELECT * FROM plant_action_types ORDER BY plant_action_type_id
  
        `
    db.query(sql, [req.body.plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getActionDataByType: (req, res) => {
    /* ...
    // #swagger.tags = ['Plant Actions']
    ...
    */
    let sql = ``
    switch (req.params.type) {
      case "14":
        sql = `
        SELECT plant_stages.plant_stage,plant_stages.user_id, plant_stages.plant_id,plant_stages.plant_stage_id,stages.stage_name,plant_stages.plant_action_id,DATE_FORMAT(plant_stages.creation_date, "%Y-%m-%dT%H:%i:%sZ")as creation_date,stages.stage_color
				FROM plant_stages
				JOIN stages ON plant_stage = stages.stage_id
				WHERE plant_stages.plant_id = ?
				ORDER BY creation_date DESC
        `
        db.query(sql, [req.body.plant_id], (err, result, fields) => {
          if (err) {
            console.log(err)
          } else {
            res.send(result)
          }
        })

        break;

        case "13":
          sql = `
          SELECT plant_note_id,plant_id,user_id,plant_action_id,plant_note,DATE_FORMAT(plant_notes.creation_date, "%Y-%m-%dT%H:%i:%sZ") as creation_date,last_updated FROM plant_notes
          WHERE plant_notes.plant_id = ?
          ORDER BY creation_date DESC
          `
          db.query(sql, [req.body.plant_id], (err, result, fields) => {
            if (err) {
              console.log(err)
            } else {
              res.send(result)
            }
          })
  
          break;

          case "4":
            sql = `
            SELECT plant_image_id,plant_id,user_id,plant_action_id,thumbnail_img,thumbnail_img_next_gen,mid_img,mid_img_next_gen,full_img,full_img_next_gen,DATE_FORMAT(creation_date, "%Y-%m-%dT%H:%i:%sZ") as creation_date FROM plant_images
            WHERE plant_images.plant_id = ?
            ORDER BY creation_date DESC
            `
            db.query(sql, [req.body.plant_id], (err, result, fields) => {
              if (err) {
                console.log(err)
              } else {
                res.send(result)
              }
            })
    
            break;

            case "1":
              sql = `
              SELECT 
              plant_feeding.plant_feeding_id,
              plant_feeding.plant_id,
              plant_feeding.user_id,
              plant_feeding.plant_action_id,
              plant_feeding.water_amount,
              plant_feeding.water_amount_measurement,
              plant_feeding.nutrient_amount,
              plant_feeding.nutrient_measurement,
              DATE_FORMAT(plant_feeding.creation_date, "%Y-%m-%dT%H:%i:%sZ") as creation_date,
              nutrient_options.nutrient_name,
              mu_water.measurement_unit as water_measurement_unit,
              mu_nutrient.measurement_unit as nutrient_measurement_unit
            FROM 
                nutrient_options 
            JOIN 
                plant_feeding ON plant_feeding.nutrient_id = nutrient_options.nutrient_id 
            JOIN 
                measurement_units mu_water ON plant_feeding.water_amount_measurement = mu_water.measurement_unit_id
            JOIN 
                measurement_units mu_nutrient ON plant_feeding.nutrient_measurement = mu_nutrient.measurement_unit_id
            WHERE 
                plant_feeding.plant_id = ?;
              `
              db.query(sql, [req.body.plant_id], (err, result, fields) => {
                if (err) {
                  console.log(err)
                } else {
                  res.send(result)
                }
              })
      
              break;
      default:
        break;
    }


  },
  takeAction: (req, res) => {
 
    pubClient = req.app.locals.pubClient
    const utcTimestamp = formatToTimeZone(new Date(req.body.creation_date), 'YYYY-MM-DD HH:mm:ss', { timeZone: 'Etc/UTC' });

    switch (parseInt(req.params.type)) {

      case 14:
        function insert_stage_action(req, res, connection, prev_result) {
          insert_stage_action_sql = `
          INSERT INTO plant_stages (plant_action_id, user_id,plant_id,plant_stage, creation_date,last_updated) 
          VALUES (${prev_result.insertId},${req.user.user_id},${req.body.plant_id},${req.body.stage_id},'${utcTimestamp}','${utcTimestamp}')`

          db.query(insert_stage_action_sql, (err, result, fields) => {
            if (err) {
              console.log(err)
              rollback(connection, res);
            } else {

              let payload = {
                type: "stage_changed",
                user: req.user,
                plant_id:req.body.plant_id,
                data: result.insertId
              }
      
              let str_payload = JSON.stringify(payload)
              pubClient.publish(process.env.CHANNEL, str_payload)

              
              res.send(result)
            }
          })

        }
        function insert_action_stage(req, res, connection) {
          sql = `INSERT INTO plant_actions (plant_id, user_id, plant_action_type_id, creation_date) VALUES (${req.body.plant_id},${req.user.user_id},${req.body.plant_action_type_id},'${utcTimestamp}')`

          db.query(sql, (err, result, fields) => {
            if (err) {
              console.log(err)
              rollback(connection, res);
            } else {

              let payload = {
                type: "action_taken",
                user: req.user,
                plant_id:req.body.plant_id,
                data: result.insertId
              }
      
              let str_payload = JSON.stringify(payload)
              pubClient.publish(process.env.CHANNEL, str_payload)

              insert_stage_action(req, res, connection, result)
            }
          })

        }
        // Acquire a connection from the pool
        db.getConnection((error, connection) => {
          if (error) {
            console.error('Error acquiring connection from the pool: ', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          // Start the transaction
          connection.beginTransaction((error) => {
            if (error) {
              console.error('Error starting the transaction: ', error);
              releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
              return;
            }

            // Perform queries within the transaction
            insert_action_stage(req, res, connection);

          });

        });
      break;

      case 13:
        function insert_note_action(req, res, connection, prev_result) {
            insert_note_action_sql = `
            INSERT INTO plant_notes (plant_action_id, user_id,plant_id,plant_note, creation_date,last_updated) 
            VALUES (${prev_result.insertId},${req.user.user_id},${req.body.plant_id},"${req.body.plant_note}",'${utcTimestamp}','${utcTimestamp}')`
  
            db.query(insert_note_action_sql, (err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {

                let payload = {
                  type: "note_added",
                  user: req.user,
                  plant_id:req.body.plant_id,
                  data: result.insertId
                }
        
                let str_payload = JSON.stringify(payload)
                pubClient.publish(process.env.CHANNEL, str_payload)

                res.send(result)
              }
            })
  
        }
        function insert_action_note(req, res, connection) {
            sql = `INSERT INTO plant_actions (plant_id, user_id, plant_action_type_id, creation_date) VALUES (${req.body.plant_id},${req.user.user_id},${req.body.plant_action_type_id},'${utcTimestamp}')`
  
            db.query(sql, (err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {

                let payload = {
                  type: "action_taken",
                  user: req.user,
                  plant_id:req.body.plant_id,
                  data: result.insertId
                }
        
                let str_payload = JSON.stringify(payload)
                pubClient.publish(process.env.CHANNEL, str_payload)

                insert_note_action(req, res, connection, result)
              }
            })
  
        }
        // Acquire a connection from the pool
        db.getConnection((error, connection) => {
            if (error) {
              console.error('Error acquiring connection from the pool: ', error);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }
            // Start the transaction
            connection.beginTransaction((error) => {
              if (error) {
                console.error('Error starting the transaction: ', error);
                releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
                return;
              }
  
              // Perform queries within the transaction
              insert_action_note(req, res, connection);
  
            });
  
        });
      break;

      case 4:
 
   
        function insert_action_image(req, res, connection) {
            sql = `INSERT INTO plant_actions (plant_id, user_id, plant_action_type_id, creation_date) VALUES (${req.body.plant_id},${req.user.user_id},${parseInt(req.params.type)},'${utcTimestamp}')`
  
            db.query(sql, async(err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {

                 let payload = {
                   type: "action_taken",
                   user: req.user,
                   plant_id:req.body.plant_id,
                   data: result.insertId
                 }
        
                 let str_payload = JSON.stringify(payload)
                 pubClient.publish(process.env.CHANNEL, str_payload)

                     
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
         let path = "https://s3.cannalog.co.za/sweetleaf/"

         let nexGen = originalFileName.split(".")[0]

        sqlInsertPlantData = `
         INSERT INTO plant_images (full_img,full_img_next_gen,thumbnail_img,thumbnail_img_next_gen,mid_img,mid_img_next_gen,plant_id, plant_action_id, user_id,creation_date) 
         VALUES 
         ("https://s3.cannalog.co.za/sweetleaf/${"full-" + originalFileName}","https://s3.cannalog.co.za/sweetleaf/${"full-" + nexGen + ".webp"}","https://s3.cannalog.co.za/sweetleaf/${sizes[0].width + "x" + sizes[0].height + "-" + originalFileName}","https://s3.cannalog.co.za/sweetleaf/${sizes[0].width + "x" + sizes[0].height + "-" + nexGen + ".webp"}","https://s3.cannalog.co.za/sweetleaf/${sizes[1].width + "x" + sizes[1].height + "-" + originalFileName}","https://s3.cannalog.co.za/sweetleaf/${sizes[1].width + "x" + sizes[1].height + "-" + nexGen + ".webp"}",${req.body.plant_id},${result.insertId},${req.user.user_id},'${utcTimestamp}')`

         await db.query(sqlInsertPlantData, (err, result, fields) => {
             if (err) {
                 console.log(err)
             } else {
              
              let payload = {
                type: "image_added",
                user: req.user,
                plant_id:req.body.plant_id,
                data: result.insertId
              }
      
              let str_payload = JSON.stringify(payload)
              pubClient.publish(process.env.CHANNEL, str_payload)

                 res.end(`Image Uploaded Successfully`)
             }
         });

  
     } catch (error) {

         console.log("error", error)
         res.status(500).json({ error: "Image upload failed" })
     }
              }
            })
  
        }
        
        // Acquire a connection from the pool
        db.getConnection((error, connection) => {
            if (error) {
              console.error('Error acquiring connection from the pool: ', error);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }
            
            // Start the transaction
            connection.beginTransaction((error) => {
              if (error) {
                console.error('Error starting the transaction: ', error);
                releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
                return;
              }

   

  
              // Perform queries within the transaction
              insert_action_image(req, res, connection);
         console.log("req",req.user)
  
            });
  
        });

        
      break;

      case 1:
        function insert_feeding_action(req, res, connection, prev_result) {
        

          let list = req.body.nutrient_list
          let nutrient_check = list.length > 0
        
          if(nutrient_check){
         
            for (let index = 0; index < list.length; index++) {
              const element = list[index];
              
              insert_feeding_action_multi_sql = `
              INSERT INTO plant_feeding (plant_action_id, user_id,plant_id,water_amount,water_amount_measurement,nutrient_id,nutrient_amount,nutrient_measurement, creation_date,last_updated) 
              VALUES (${prev_result.insertId},${req.user.user_id},${req.body.plant_id},"${req.body.water_amount}",${req.body.water_amount_measurement},${element.nutrient_id},${element.nutrient_amount},${element.nutrient_measurement}, '${utcTimestamp}','${utcTimestamp}')`

              
            db.query(insert_feeding_action_multi_sql, (err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {
                if(index == list.length - 1){
                // let payload = {
                //   type: "note_added",
                //   user: req.user,
                //   plant_id:req.body.plant_id,
                //   data: result.insertId
                // }
        
                // let str_payload = JSON.stringify(payload)
                // pubClient.publish(process.env.CHANNEL, str_payload)

             
                  res.send(result)
                }
              }
            })

            }
          }else{
            console.log("insert_feeding_action",nutrient_check)
            insert_feeding_action_sql = `
            INSERT INTO plant_feeding (plant_action_id, user_id,plant_id,water_amount,water_amount_measurement, creation_date,last_updated) 
            VALUES (${prev_result.insertId},${req.user.user_id},${req.body.plant_id},"${req.body.water_amount}",${req.body.water_amount_measurement},'${utcTimestamp}','${utcTimestamp}')`

            db.query(insert_feeding_action_sql, (err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {
                
                // let payload = {
                //   type: "note_added",
                //   user: req.user,
                //   plant_id:req.body.plant_id,
                //   data: result.insertId
                // }
        
                // let str_payload = JSON.stringify(payload)
                // pubClient.publish(process.env.CHANNEL, str_payload)

             
                  res.send(result)
            
              }
            })
          }
          
     
  
        }
        function insert_action_feeding(req, res, connection) {
            sql = `INSERT INTO plant_actions (plant_id, user_id, plant_action_type_id, creation_date) VALUES (${req.body.plant_id},${req.user.user_id},${req.body.plant_action_type_id},'${utcTimestamp}')`
  
            db.query(sql, (err, result, fields) => {
              if (err) {
                console.log(err)
                rollback(connection, res);
              } else {

                let payload = {
                  type: "action_taken",
                  user: req.user,
                  plant_id:req.body.plant_id,
                  data: result.insertId
                }
        
                let str_payload = JSON.stringify(payload)
                pubClient.publish(process.env.CHANNEL, str_payload)

                insert_feeding_action(req, res, connection, result)
              }
            })
  
        }
        // Acquire a connection from the pool
        db.getConnection((error, connection) => {
            if (error) {
              console.error('Error acquiring connection from the pool: ', error);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }
            // Start the transaction
            connection.beginTransaction((error) => {
              if (error) {
                console.error('Error starting the transaction: ', error);
                releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
                return;
              }
  
              // Perform queries within the transaction
              insert_action_feeding(req, res, connection);
  
            });
  
        });
      break;

    
    }
  },

  deleteAction:(req, res)=>{
    pubClient = req.app.locals.pubClient

    deleteAction_sql = ` DELETE FROM plant_actions WHERE plant_actions.plant_action_id = ? AND plant_actions.user_id = ?`

    db.query(deleteAction_sql,[req.params.plant_action_id,req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)
        rollback(connection, res);
      } else {

        let payload = {
          type: "action_deleted",
          plant_action_id:req.params.plant_action_id,
          plant_id:req.params.plant_id,
          data: result.affectedRows
        }

        let payload2 = {
          type: "action_taken",
          plant_action_id:req.params.plant_action_id,
          plant_id:req.params.plant_id,
          data: result.affectedRows
        }
        
        let str_payload = JSON.stringify(payload)
        let str_payload2 = JSON.stringify(payload2)
        
        pubClient.publish(process.env.CHANNEL, str_payload)
        pubClient.publish(process.env.CHANNEL, str_payload2)
        
        res.send(result)
      }
    })
  }
}