const fs = require('fs')

function convertToEnvVar(paramsJsonString, stage) {
  const params = JSON.parse(paramsJsonString)
  const output = []
  const prefix = `/sst/inbox-hero/${stage}/Secret/`
  for (const param of params) {
    const name = param['Name'].replace(prefix, '').replace('/value', '')
    const value = param['Value']
    output.push(`${name}="${value}"`)
  }
  // create .env file
  fs.writeFileSync('.env', '', { flag: 'w' })
  // use fs to append
  for (const line of output) {
    fs.writeFileSync('.env', line + '\n', { flag: 'a' })
  }
}

const inputParams = process.argv.slice(2)

convertToEnvVar(...inputParams)
