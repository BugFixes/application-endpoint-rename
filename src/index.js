const bugfixes = require('bugfixes')
const ApplicationModel = require('bugfixes-application-models')
const AccountModel = require('bugfixes-account-models')
const Logs = require('bugfixes-account-logging')

const bugfunctions = bugfixes.functions

module.exports = (event, context, callback) => {
  let eventBody = JSON.parse(event.body)

  let log = new Logs()
  log.action = 'Rename App'
  log.content = {
    apiKey: event.requestContext.identity.apiKey,
    eventBody: eventBody
  }
  log.authyId = event.headers.authyId
  log.requestId = event.headers.requestId

  let account = new AccountModel()
  account.authyId = parseInt(event.headers.authyId)
  account.getAccount((error, result) => {
    if (error) {
      log.content.error = error
      log.send()

      bugfixes.error('Rename App', 'Account Check', error)

      return callback(error)
    }

    if (result.accountId) {
      let accountId = result.accountId

      log.accountId = accountId

      let application = new ApplicationModel()
      application.accountId = accountId
      application.key = eventBody.applicationKey
      application.secret = eventBody.applicationSecret
      application.name = eventBody.name
      application.rename((error, result) => {
        if (error) {
          log.content.error = error
          log.send()

          bugfixes.error('Rename App', 'Application', error)

          return callback(error)
        }

        log.send()

        return callback(null, bugfunctions.lambdaResult(7000, result))
      })
    } else {
      return callback(null, bugfunctions.lambdaError(7001, 'Invalid Account'))
    }
  })
}
