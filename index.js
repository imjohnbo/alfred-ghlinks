import alfy from 'alfy'
import { Octokit } from '@octokit/rest'
const octokit = getOctokit()

try {
  checkEnv()
  setCache(await getRemoteLinks()) // eslint-disable-line
  handleInput(alfy.input)
} catch (error) {
  alfy.error(error)
  process.exit(1)
}

function checkEnv () {
  if (!process.env.GITHUB_JSON_FILENAME ||
    !process.env.GITHUB_REPO ||
    !process.env.GITHUB_TOKEN) {
    throw new Error('Required workflow environment variables missing (GITHUB_JSON_FILENAME, GITHUB_REPO, and GITHUB_TOKEN). Please set them in your workflow settings.')
  }
}

function getOctokit () {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
}

async function getRemoteLinks () {
  const [owner, repo] = process.env.GITHUB_REPO.split('/') || ['imjohnbo', 'ghLinks-example']
  const path = process.env.GITHUB_JSON_FILENAME || 'ghLinks.json'

  const { data: ghLinks } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    mediaType: {
      format: 'raw'
    }
  })

  return JSON.parse(ghLinks)
}

function setCache (ghLinks) {
  alfy.cache.set('ghLinks', ghLinks, { maxAge: 5000 })
}

function handleInput (input) {
  // ghl #tag
  if (input[0] === '#') {
    findBy(input, 'tag')
  // ghl alias
  } else {
    findBy(input, 'alias')
  }
}

function findBy (input, field) {
  const links = alfy.cache.get('ghLinks')

  const items = alfy
    .matches(input, links, field)
    .map(element => ({
      title: element.name,
      subtitle: element.url,
      arg: element.url
    }))

  alfy.output(items)
}
