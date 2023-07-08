// Rollback the transaction and release the connection
function rollback(connection, res) {
    connection.rollback(() => {
      console.log('Transaction rolled back.');
      releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
    });
  }
  
  // Commit the transaction, release the connection, and send the response
function commit(connection,res, query1Results, query2Results) {
    connection.commit((error) => {
      if (error) {
        console.error('Error committing the transaction: ', error);
        rollback(connection, res);
        return;
      }
  
      console.log('Transaction committed.');
      releaseConnectionAndRespond(connection, res, 200,  query2Results );
    });
  }
  
  // Release the connection and send the response
function releaseConnectionAndRespond(connection, res, status, data) {
    connection.release();
    res.status(status).json(data);
  }
  

module.exports = {
    rollback,
    commit,
    releaseConnectionAndRespond
};