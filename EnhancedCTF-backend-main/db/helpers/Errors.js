
ASYNC_FAILURE = -1;

//sends a 500 error code and logs the error to the console.
function handleServerError(functionName,httpResponse,err){
    console.error("Error in query, " + functionName + ":",err.stack);
    httpResponse.status(500).send("Internal Server Error");
}

module.exports={
    handleServerError,
    ASYNC_FAILURE
}