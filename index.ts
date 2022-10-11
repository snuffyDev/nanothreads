import { Semaphore, thread, Mutex } from './dist/index-node.js';

const lock = new Mutex();

const worker = thread<string>().spawn(async (url)=> {
	const h = require('https')
	return new Promise<string>(resolve => {

		//@ts-ignore node types
		h.get(url, (res)=>{
			let out = ""

			//@ts-ignore node types
			res.setEncoding("utf8")

			res.on('end', ()=> {resolve(out)});

			//@ts-ignore node types
			res.on('data', (chunk) => out += chunk);
		})
	})
});

const sleep = (ms = 1000) => new Promise((resolve) => {
	setTimeout(resolve, ms);
})
async function http(url: string) {
	return await lock.dispatch(async ()=>{
		await sleep(2500)
		//@ts-ignore
		return await fetch(url).then((res) => res.text())
	})
}

async function main(){
	const url = "https://beatbump.ml/api/v1/stats.json"

	/**
	 * Testing Threading
	 * ====
	 * Simple, easy, quick threading in the browser & Node.js
	 */
	const thread_response = await worker(("https://beatbump.ml/api/v1/stats.json")).join();

	console.group("Threading")
	console.log(JSON.parse(thread_response[1]))
	console.groupEnd();
	console.group("Semaphore")
	/**
	 * Testing Semaphore
	 * =====
	 * The code below, when run without `await`, normally would
	 * immediately send each request without waiting for the others
	 * to finish.
	 *
	 * ```
	 * const http = async (url: string) => await fetch(url),then((res) => res.text())
	 * ```
	 *
	 * With the Semaphore, we have more control over how the code
	 * will execute, and when it will execute.
	 *
	 * The lock that's used below has a limit of 2
	 */
	for (let i = 0; i < 8; i++) {
		http(url).then((res)=>{
			console.log(res)
		});
	}

	console.groupEnd();
}


main()