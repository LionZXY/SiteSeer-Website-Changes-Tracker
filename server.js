require('dotenv').config();
const axios = require('axios');
const { createHash } = require('crypto');
const { JSDOM } = require('jsdom');
const mongoose = require('mongoose');
const Telegraf = require('telegraf');

const { env } = process;
const { Schema, model, Types: { ObjectId } } = mongoose;

const people = env.PEOPLE ? env.PEOPLE.split(',') : [ 'Akash' ];
const admin = env.ADMIN ? Number(env.ADMIN) : 475757469;
const updateInterval = env.UPDATE_INTERVAL || 900;
const maxAge = env.MAX_AGE || 900;
const mongoURL = env.MONGO_URI || 'mongodb://localhost:27017/SiteSeer';
const token = env.BOT_TOKEN;
const debug = Boolean(env.DEBUG) || true;
const ads = Boolean(env.ADS) || true;

if (!token) {
	throw new Error('Missing BOT_TOKEN env var');
}


//Function to calculate checksum using crypto
const checksum = input => {
	const dom = new JSDOM(input)
	const inp1 = dom.window.document.querySelector('body').textContent.trim()
	return createHash('md5').update(inp1).digest('hex')
}

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(mongoURL, { useNewUrlParser: true });

const SiteSchema = new Schema({
	url: { type: String, required: true, unique: true },
	checked: { type: Date, required: true, default: Date.now },
	checksum: { type: String }
});
const Site = model('Site', SiteSchema);

const ChatSchema = new Schema({
	id: { type: Number, required: true, unique: true },
	sites: {
		type: [ { type: Schema.Types.ObjectId, ref: 'Site' } ],
		required: true,
		default: [],
		validate: x => x.length <= 100
	}
});

const Chat = model('Chat', ChatSchema);

const ensureSiteExists = url =>
	Site.findOneAndUpdate(
		{ url },
		{ $set: { url, checked: Date.now() } },
		{ upsert: true, new: true, setDefaultsOnInsert: true });

const ensureChatExists = id =>
	Chat.findOneAndUpdate(
		{ id },
		{ $set: { id } },
		{ upsert: true, new: true, setDefaultsOnInsert: true });

const ensureExists = (url, id, populate = false) =>
	Promise.all([
		ensureSiteExists(url),
		populate
			? ensureChatExists(id).populate('sites')
			: ensureChatExists(id)
	]);

const urlFromMessage = text => {
	const arg = text.split(' ').slice(1).join('');
	return (/^http(s)?:\/\//).test(arg) ? arg : `http://${arg}`;
};

const messageAll = async (site_id, message) => {
	Chat.find({ sites: site_id },(err,data)=>{
		//console.log(util.inspect(data));
		const allChats=data;
		Promise.all(allChats.map(chat=>{
			bot.telegram.sendMessage(chat.id, message);
		}))
	})
};

const siteWatcher = url =>
	axios(url)
		.then(res => res.data)
		.then(checksum);

const checkSite = site =>
	siteWatcher(site.url)
		.then(checksum =>
			Promise.all([
				site.updateOne({ $set: { checksum, checked: Date.now() } }),
				messageAll(site._id, [
					`The site, ${site.url}, might have changed!`,
					...ads
						? [
							'Support me here :\nhttp://m.p-y.tm/requestPayment?recipient=8669091448',
							'OR',
							'ko-fi.com/akashjoshi'
						]
						: []
				].join('\n\n'))
			]))
		.catch(err =>
			Promise.all([
				site.updateOne({ $set: { checked: Date.now() } }),
				messageAll(site._id, `The site, ${site.url}, is down!` +
					(debug ? ' (' + err.message + ')' : ''))
			]));

const batchWatch = async () => {
	const allSites = await Site.find({
		checked: { $lte: Date.now() - (maxAge * 1000) }
	})
	for  (const site of allSites) {
		 checkSite(site);
	}
};

const bot = new Telegraf(token);

bot.command('start', ctx => ctx.reply(`Welcome to SiteSeer !
Made by www.linkedin.com/in/akash-s-joshi 👻. 

/list to list websites
/watch {sitename} to watch a site, without {}
/unsub {sitename} to unsubscribe from the site, without {}

Note : Doesn't work for dynamic sites like Instagram or Facebook.

Your chatid is ${ctx.chat.id}`));

// Matches "/echo [whatever]"
bot.command('watch', ({ chat: { id }, message: { text }, reply }) =>
	ensureExists(urlFromMessage(text), id)
		.then(([ site, chat ]) =>
			[ site, chat, chat.sites.some(x => x.equals(site.id)) ])
		.then(([ site, chat, chatHasSite ]) =>
			chatHasSite
				? reply('Already subscribed')
				: chat.updateOne(
					{ $push: { sites: site._id } },
					{ new: true })
					.then(() =>
						reply(`Checking ${site.url} for you!`))
					.then(() => checkSite(site))));

bot.command('list', ({ chat: { id }, reply }) =>
	ensureChatExists(id).populate('sites')
		.then(({ sites }) =>
			reply('Sites currently being checked by bot are \n' +
				sites.map(x => x.url).join('\n\n') +
				'\n\nUse /watch sitename " to subscribe to notifs of that site' +
				'\n\nUse /unsub sitename to unsubscribe')));

bot.command('unsub', ({ chat: { id }, message: { text }, reply }) => {
	const url = urlFromMessage(text);
	return ensureExists(url, id, true)
		.then(([ site, chat ]) =>
			[ site, chat, chat.sites.find(x => x.url === site.url) ])
		.then(([ site, chat, siteToRemove ]) =>
			siteToRemove && chat.updateOne(
				{ $pull: { sites: siteToRemove._id } }))
		.then(res =>
			reply(
				res
					? `If you were subscribed to ${url}, you no longer are`
					: `"${url}" isn't a valid site. Please check /list for available websites`));
});

batchWatch();

setInterval(() => {
	batchWatch();
}, updateInterval * 1000);

bot.catch(console.error);

bot.telegram.sendMessage(
	admin,
	`Hello ${people.join(', ')}, the bot just restarted`)
	.then(() =>
	bot.startPolling());

require('http').createServer(function (req, res) {
	res.write('Hello World!'); //write a response to the client
	res.end(); //end the response
	}).listen(8080); 