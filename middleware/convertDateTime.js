
const { formatToTimeZone } = require('date-fns-timezone');
const { zonedTimeToUtc, format } = require('date-fns-tz');
const { parse } = require('date-fns');

function convertDateTime(req, res, next)  {
  
  console.log("convertDateTime")
  let creation_date = req.body.creation_date
  let time_zone= req.body.timezone

  if(creation_date && time_zone){

  // Parse the user-submitted date string in the user's timezone
  const userDate = parse(creation_date, 'yyyy-MM-dd HH:mm:ss', new Date(), { timeZone: time_zone });

  // Convert the user's local date to UTC
  const utcDate  = zonedTimeToUtc(userDate, time_zone);

  // Format the UTC date as a string
  const utcTimestamp = format(utcDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Etc/UTC' });
  
  req.creation_date = utcTimestamp

  next()

  }else{
    res.send(500)
  }
 
}

  module.exports = convertDateTime