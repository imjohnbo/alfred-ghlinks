import alfy from 'alfy'
import { Octokit } from '@octokit/rest'

const filename = process.env.JSON_FILENAME
const nwo = process.env.GITHUB_NWO
const token = process.env.GITHUB_TOKEN

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
  if (!filename || !nwo || !token) {
    throw new Error('Required workflow user configuration missing (JSON_FILENAME, GITHUB_NWO, and GITHUB_TOKEN). Please set them in your workflow settings.')
  }
}

function getOctokit () {
  return new Octokit({
    auth: token
  })
}

async function getRemoteLinks () {
  const [owner, repo] = nwo.split('/')

  if (!owner || !repo) {
    throw new Error('GitHub repo name with owner must be in format owner/repo, e.g. monalisa/hello-world.')
  }

  const { data: ghLinks } = await octokit.repos.getContent({
    owner,
    repo,
    path: filename,
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
