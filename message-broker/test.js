const tokenId = "hello world"
console.log("******* 1", btoa(tokenId))
console.log("******* 1", Buffer.from(tokenId, 'binary').toString('base64'))
