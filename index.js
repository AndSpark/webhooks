const http = require('http')
const { execSync } = require('child_process')

const port = 3020
const webBasePath = '/www/wwwroot/'
const needProxy = true

const resolvePost = req =>
	new Promise(resolve => {
		let chunk = ''
		req.on('data', data => {
			chunk += data
		})
		req.on('end', () => {
			resolve(JSON.parse(chunk))
		})
	})

const autobuild = name => {
	const cwd = webBasePath + name
	if (needProxy) {
		execSync(
			'export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890'
		)
	}
	console.log('git pull ' + cwd)
	execSync('git pull', { cwd })
	console.log('git pull finished')
	execSync('yarn', { cwd })
	console.log('yarn install finished')
	execSync('yarn prod', { cwd })
	console.log('yarn prod finished')
}

http
	.createServer(async (req, res) => {
		console.log('receive request')
		if (req.method === 'POST' && req.url === '/webhooks') {
			const data = await resolvePost(req)

			let giturl = data.repository.html_url

			console.log('next callfile', giturl)

			res.end('ok')

			autobuild(data.repository.name)
		} else {
			res.end('error')
		}
	})
	.listen(port, () => {
		console.log('server is ready')
	})
