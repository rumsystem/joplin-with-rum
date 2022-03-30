"use strict"

require('source-map-support').install();
require('babel-plugin-transform-runtime');

import { time } from 'lib/time-utils.js';
import { Logger } from 'lib/logger.js';
import { Resource } from 'lib/models/resource.js';
import { dirname } from 'lib/path-utils.js';
import { FsDriverNode } from './fs-driver-node.js';
import lodash from 'lodash';
const exec = require('child_process').exec
const fs = require('fs-extra');

const baseDir = dirname(__dirname) + '/tests/fuzzing';
const syncDir = baseDir + '/sync';
const joplinAppPath = __dirname + '/main.js';
let syncDurations = [];

const fsDriver = new FsDriverNode();
Logger.fsDriver_ = fsDriver;
Resource.fsDriver_ = fsDriver;

const logger = new Logger();
logger.addTarget('console');
logger.setLevel(Logger.LEVEL_DEBUG);

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled promise rejection', p, 'reason:', reason);
});

function createClient(id) {
	return {
		'id': id,
		'profileDir': baseDir + '/client' + id,
	};
}

async function createClients() {
	let output = [];
	let promises = [];
	for (let clientId = 0; clientId < 2; clientId++) {
		let client = createClient(clientId);
		promises.push(fs.remove(client.profileDir));
		promises.push(execCommand(client, 'config sync.target local').then(() => { return execCommand(client, 'config sync.local.path ' + syncDir); }));
		output.push(client);
	}

	await Promise.all(promises);

	return output;
}

function randomElement(array) {
	if (!array.length) return null;
	return array[Math.floor(Math.random() * array.length)];
}

function randomWord() {
	const words = ['belief','scandalous','flawless','wrestle','sort','moldy','carve','incompetent','cruel','awful','fang','holistic','makeshift','synonymous','questionable','soft','drop','boot','whimsical','stir','idea','adhesive','present','hilarious','unusual','divergent','probable','depend','suck','belong','advise','straight','encouraging','wing','clam','serve','fill','nostalgic','dysfunctional','aggressive','floor','baby','grease','sisters','print','switch','control','victorious','cracker','dream','wistful','adaptable','reminiscent','inquisitive','pushy','unaccountable','receive','guttural','two','protect','skin','unbiased','plastic','loutish','zip','used','divide','communicate','dear','muddled','dinosaurs','grip','trees','well-off','calendar','chickens','irate','deranged','trip','stream','white','poison','attack','obtain','theory','laborer','omniscient','brake','maniacal','curvy','smoke','babies','punch','hammer','toothbrush','same','crown','jagged','peep','difficult','reject','merciful','useless','doctor','mix','wicked','plant','quickest','roll','suffer','curly','brother','frighten','cold','tremendous','move','knot','lame','imaginary','capricious','raspy','aunt','loving','wink','wooden','hop','free','drab','fire','instrument','border','frame','silent','glue','decorate','distance','powerful','pig','admit','fix','pour','flesh','profuse','skinny','learn','filthy','dress','bloody','produce','innocent','meaty','pray','slimy','sun','kindhearted','dime','exclusive','boast','neat','ruthless','recess','grieving','daily','hateful','ignorant','fence','spring','slim','education','overflow','plastic','gaping','chew','detect','right','lunch','gainful','argue','cloistered','horses','orange','shame','bitter','able','sail','magical','exist','force','wheel','best','suit','spurious','partner','request','dog','gusty','money','gaze','lonely','company','pale','tempt','rat','flame','wobble','superficial','stop','protective','stare','tongue','heal','railway','idiotic','roll','puffy','turn','meeting','new','frightening','sophisticated','poke','elderly','room','stimulating','increase','moor','secret','lean','occur','country','damp','evanescent','alluring','oafish','join','thundering','cars','awesome','advice','unruly','ray','wind','anxious','fly','hammer','adventurous','shop','cook','trucks','nonchalant','addition','base','abashed','excuse','giants','dramatic','piquant','coach','possess','poor','finger','wide-eyed','aquatic','welcome','instruct','expert','evasive','hug','cute','return','mice','damage','turkey','quiet','bewildered','tidy','pointless','outrageous','medical','foolish','curve','grandiose','gullible','hapless','gleaming','third','grin','pipe','egg','act','physical','eager','side','milk','tearful','fertile','average','glamorous','strange','yak','terrific','thin','near','snails','flowery','authority','fish','curious','perpetual','healthy','health','match','fade','chemical','economic','drawer','avoid','lying','minister','lick','powder','decay','desire','furry','faint','beam','sordid','fax','tail','bawdy','cherry','letter','clover','ladybug','teeth','behavior','black','amazing','pink','waste','island','forgetful','needless','lock','waves','boundary','receipt','handy','religion','hypnotic','aftermath','explain','sense','mundane','rambunctious','second','preserve','alarm','dusty','event','blow','weigh','value','glorious','jail','sigh','cemetery','serious','yummy','cattle','understood','limit','alert','fear','lucky','tested','surround','dolls','pleasant','disillusioned','discover','tray','night','seemly','liquid','worry','pen','bent','gruesome','war','teeny-tiny','common','judge','symptomatic','bed','trot','unequaled','flowers','friends','damaged','peel','skip','show','twist','worthless','brush','look','behave','imperfect','week','petite','direction','soda','lively','coal','coil','release','berserk','books','impossible','replace','cough','chunky','torpid','discreet','material','bomb','soothe','crack','hope','license','frightened','breathe','maddening','calculator','committee','paltry','green','subsequent','arrest','gigantic','tasty','metal','willing','man','stem','nonstop','route','impulse','government','comfortable','include','literate','multiply','test','vast','exercise','addicted','agreeable','lace','toes','young','water','end','wash','glossy','round','staking','sink','open','spot','trip','fierce','robust','pastoral','drown','dress','machine','calculating','holiday','crabby','disgusting','plan','sleet','sleepy','typical','borrow','possible','curtain','airplane','industry','nut','rough','wacky','rock','enormous','uninterested','sugar','rake','consist','wrist','basket','chop','wet','street','known','settle','bless','cluttered','wild','expand','angle','snake','yawn','hate','flood','rabid','spiteful','anger','market','bizarre','force','majestic','scissors','beg','rifle','foregoing','cactus','funny','eggnog','wish','high-pitched','drop','camp','scarf','car','groan','wonderful','wealthy','cup','lock','available','previous','jam','political','vacation','three','desk','fry','aspiring','productive','clear','bored','flashy','plug','precede','abhorrent','muddle','flimsy','paste','need','reward','frail','obnoxious','creature','whip','unbecoming','lake','unused','chin','tour','zephyr','experience','building','scrub','correct','hover','panicky','scorch','diligent','hulking','ubiquitous','tedious','aberrant','file','accidental','mist','blue-eyed','trite','nondescript','cows','wait','test','snotty','amuck','jump','lackadaisical','grey','tawdry','strong','land','kind','star','ludicrous','stupid','telling','use','bruise','whirl','cream','harsh','aboriginal','substantial','brawny','tease','pollution','weather','degree','dry','film','obey','closed','dependent','want','undesirable','stamp','relax','foot','obscene','successful','wriggle','drain','greasy','escape','cross','odd','boring','absorbed','houses','suppose','suit','moon','ceaseless','explode','clap','pop','courageous','miss','notebook','delirious','form','pretty','sock','grotesque','noxious','record','stop','saw','thing','dislike','cloth','six','jar','unnatural','spiffy','itchy','secretary','move','certain','unkempt','sassy','queue','shrug','crow','heavenly','desert','screw','vessel','mug','encourage','icy','enthusiastic','throat','whistle','ignore','miniature','squeak','scarecrow','fluttering','hang','icicle','lie','juicy','empty','baseball','various','promise','abortive','descriptive','high','spy','faded','talk','air','messup','decorous','sneaky','mark','sack','ultra','chivalrous','lethal','expect','disgusted','reaction','fireman','private','ritzy','manage','actor','rely','uppity','thread','bat','space','underwear','blood','nine','maid','shelf','hanging','shop','prick','wound','sloppy','offer','increase','clear','slap','rude','poised','wretched','cause','quince','tame','remarkable','abject','sail','guide','subdued','spiky','debonair','chicken','tired','hum','land','scared','splendid','guess','cast','rub','magnificent','ants','overwrought','interfere','gorgeous','office','trade','sniff','melted','bore','point','pet','purple','brake','flavor','toe','prickly','zinc','homely','modern','kindly','whisper','bare','annoyed','glass','noisy','null','thoughtless','skirt','dock','rings','mind','neck','macho','wave','history','play','road','profit','word','opposite','dreary','governor','horse','trust','elbow','kiss','crayon','stitch','excited','needy','arrange','easy','alcoholic','safe','lumpy','monkey','smile','capable','untidy','extra-small','memory','selective','reproduce','old-fashioned','overrated','texture','knit','downtown','risk','pot','sofa','righteous','wren','pull','carry','aboard','listen','classy','thank','shocking','condition','root','attempt','swim','frog','hurt','army','title','handsomely','town','guiltless','thaw','spell','selfish','disturbed','tramp','girls','utopian','noiseless','trail','bashful','business','rhetorical','snail','sign','plausible','left','design','tall','violent','wasteful','beautiful','breezy','tap','murder','talented','needle','creator','imagine','flippant','dead','bone','coherent','relation','aromatic','mountainous','face','ask','picture','pedal','colour','obese','group','top','bubble','pinch','optimal','school','bathe','flagrant','check','deliver','pass','tan','crate','hose','debt','faulty','longing','hollow','invincible','afford','lovely','ticket','changeable','subtract','fumbling','responsible','confused','woman','touch','watch','zesty','library','jail','wrap','terrify','brick','popcorn','cooperative','peck','pocket','property','buzz','tiresome','digestion','exciting','nation','juvenile','shade','copper','wanting','deer','waste','man','join','spotty','amused','mountain','waggish','bushes','tense','river','heartbreaking','help','mine','narrow','smash','scrawny','tame','rain','playground','airport','astonishing','level','befitting','animal','heat','painful','cellar','ski','sedate','knowing','vigorous','change','eight','ship','work','strip','robin','tank','challenge','vacuous','representative','regret','tightfisted','erratic','club','imported','therapeutic','rainstorm','luxuriant','relieved','day','system','apologise','male','prepare','malicious','naive','whistle','curl','hobbies','trousers','stereotyped','dad','endurable','grass','hot','bomb','morning','guide','keen','plot','accept','disastrous','macabre','year','spicy','absorbing','sticks','efficient','drain','warm','rice','utter','fact','marked','ratty','chalk','towering','treat','nest','annoy','jealous','stamp','effect','cautious','jelly','feigned','gabby','corn','volleyball','pan','psychedelic','fairies','silent','zonked','bump','trouble','mass','queen','things','bury','sister','quiet','colossal','puncture','four','attend','love','wiry','vegetable','destruction','note','pies','resolute','load','fancy','tacky','periodic','abandoned','vivacious','blush','wrathful','miscreant','call','striped','wiggly','supreme','hand','impolite','rule','deserted','concern','cover','harbor','waiting','soggy','psychotic','ancient','sponge','domineering','elegant','impartial','unlock','abrasive','count','flight','neighborly','roof','bulb','auspicious','automatic','magic','sign','amusing','orange','branch','sulky','attack','fetch','number','jellyfish','start','alike','touch','sour','wary','minor','punish','connect','protest','pie','kaput','doubtful','friendly','simplistic','smart','vanish','applaud','jumbled','ready','yell','support','squash','raise','parallel','super','jazzy','crush','apathetic','water','food','thrill','permit','heady','last','mine','signal','smoke','preach','x-ray','name','birth','minute','steel','bedroom','female','acrid','riddle','attractive','earth','crack','muscle','alive','guarded','sweater','donkey','doubt','lettuce','magenta','live','farm','glib','bow','fascinated','friend','practise','remember','bleach','hungry','voiceless','pin','sparkling','report','arm','sad','shaggy','parcel','wail','flash','territory','functional','wise','screeching','appliance','future','appear','team','rabbit','porter','paint','flat','amusement','ocean','head','geese','wash','embarrassed','tub','boundless','freezing','mushy','surprise','temporary','marble','recondite','telephone','zipper','pine','reign','pump','tangy','reply','toys','purpose','songs','form','delicious','wood','horn','nutty','fruit','lumber','potato','cheat','cloudy','visit','reduce','destroy','deafening','full','warlike','mitten','cover','earthy','seashore','yarn','tenuous','pause','boil','dogs','tough','knife','shy','naughty','existence','fire','eminent','remove','juice','sleep','voyage','balance','unsightly','plough','ill-fated','pumped','motionless','allow','trade','warm','toad','wave','wall','pigs','circle','rejoice','ear','drink','found','taboo','object','old','temper','plant','public','picayune','blot','delight','carpenter','dispensable','tire','cow','furniture','rightful','mute','gentle','gifted','ragged','stiff','retire','compare','sable','hole','judicious','chilly','sparkle','futuristic','love','bubble','travel','name','numberless','succeed','acoustic','lowly','society','injure','agree','reason','party','wool','careful','hook','bell','ball','attach','scream','development','happy','appreciate','disagree','request','march','rampant','scrape','sack','hair','measure','owe','grubby','vein','boy','punishment','smoggy','wry','immense','shoe','pack','brash','cave','sincere','adorable','fantastic','attraction','racial','jittery','defiant','honey','paper','weight','bee','blind','birthday','toothsome','trick','guard','fog','handle','dirty','salt','rinse','nippy','observe','suggestion','weak','instinctive','frequent','detail','verse','quirky','scattered','toy','aware','distribution','repulsive','draconian','bucket','harm','radiate','bang','shrill','living','rhythm','obsequious','drum','inject','skate','beds','smash','order','stitch','ground','nosy','kick','dusty','home','rot','frame','jam','sky','soap','rescue','energetic','grape','massive','deeply','dazzling','park','pull','number','abundant','barbarous','drag','ajar','close','moan','haircut','shade','married','cats','thirsty','dirt','vagabond','fearful','squealing','squalid','zebra','murky','sheet','fat','follow','bikes','unpack','materialistic','surprise','arch','selection','acoustics','helpless','thoughtful','cry','quarrelsome','arrogant','illegal','sudden','elite','tomatoes','spoil','flower','shivering','front','caption','volcano','ugliest','ambitious','pickle','interrupt','nervous','approve','messy','dust','oceanic','brass','tremble','fine','nerve','lunchroom','hard','engine','erect','flower','cynical','irritating','tight','cobweb','gray','invention','snatch','account','sharp','spooky','squeamish','eatable','share','need','moaning','suspect','rush','rural','false','float','bite','careless','sidewalk','cowardly','stroke','educated','ugly','type','wandering','bolt','mint','fit','large','extra-large','defeated','kitty','tacit','abiding','grandfather','trains','lamp','habitual','fast','offbeat','accurate','many','fortunate','lyrical','charge','illustrious','transport','wakeful','cable','ordinary','string','question','train','fancy','kick','enchanting','jobless','ahead','comparison','loose','dance','add','wonder','stale','earn','reflective','bright','true','statuesque','amount','matter','repair','care','ruin','terrible','elastic','spiders','craven','lamentable','decision','swing','connection','gaudy','knowledge','cheap','lazy','step','dinner','rod','agreement','comb','mean','past','knotty','busy','quicksand','match','early','long','onerous','ambiguous','worried','spade','happen','crook','dapper','grate','announce','plate','haunt','friction','actually','chance','example','rapid','zealous','necessary','ink','mere','shock','huge','jaded','spill','store','fuzzy','table','bottle','halting','spark','end','remain','transport','seat','leg','long-term','clip','grumpy','shake','walk','try','action','soup','short','hurry','square','belligerent','thankful','beginner','small','bumpy','silly','badge','marvelous','wealth','open','unequal','scatter','pest','fool','step','groovy','childlike','door','bouncy','believe','incredible','box','unhealthy','swanky','abrupt','depressed','flaky','famous','detailed','regret','envious','natural','apparel','spare','mark','ten','power','glistening','arrive','animated','slip','heap','shaky','unfasten','contain','inexpensive','introduce','shallow','rule','gather','pump','humorous','acceptable','womanly','giddy','silk','yoke','straw','invite','one','red','growth','unadvised','measly','flap','puzzled','regular','painstaking','little','plain','tumble','rest','fabulous','melt','label','truculent','internal','passenger','zippy','bright','earsplitting','tooth','veil','grip','square','stuff','gate','level','stone','observation','time','workable','bird','realise','spotted','coast','quiver','rebel','entertain','rotten','loss','collect','meal','satisfy','military','bake','cagey','redundant','treatment','knock','blink','scale','board','fair','nebulous','sip','homeless','place','complain','joke','bat','winter','choke','frantic','chubby','highfalutin','troubled','whole','rose','delightful','loaf','afraid','sturdy','class','cultured','yielding','broken','kittens','absurd','discovery','next','disarm','dangerous','lively','reflect','chief','teeny','pencil','ban','grade','size','dashing','thought','breath','empty','hellish','shock','sea','weary','payment','limping','premium','grateful','somber','tax','coach','vulgar','stretch','tow','branch','insurance','yam','stormy','wish','snow','cute','milky','battle','far','roasted','slip','adamant','awake','employ','tangible','tickle','jog','hysterical','meddle','parsimonious','judge','educate','respect','sound','oven','gratis','station','train','purring','steady','carriage','humdrum','voracious','jolly','brainy','proud','elfin','cure','motion','record','quizzical','pail','bike','faithful','approval','vague','fall','store','normal','rock','bear','bounce','giant','satisfying','crooked','lopsided','vest','separate','sneeze','teaching','general','meat','festive','historical','line','north','tip','son','damaging','nimble','broad','list','confuse','first','deserve','steep','last','rich','oval','thick','glow','great','clammy','cheer','untidy','scientific','noise','stomach','undress','big','bite-sized','enter','cake','aloof','abnormal','month','grab','well-groomed','silver','art','berry','giraffe','complete','billowy','thumb','squeal','crib','discussion','even','stretch','mellow','angry','grouchy','absent','snow','middle','stingy','mourn','deep','honorable','nice','verdant','reach','lavish','sin','interest','whine','tug','vengeful','rhyme','stay','upset','hesitant','tent','wire','gold','momentous','yellow','cap','delicate','youthful','twig','burly','devilish','chess','wide','misty','useful','memorise','madly','plants','spectacular','accessible','collar','truck','harmony','uncovered','beef','low','channel','abusive','analyse','observant','snobbish','duck','excellent','intend','wreck','testy','care','shoes','charming','demonic','can','wipe','acidic','watch','decisive','brave','greet','imminent','influence','oranges','seal','eggs','knowledgeable','ashamed','shiny','inconclusive','remind','house','solid','quixotic','describe','support'];
	return randomElement(words);
}

function execCommand(client, command, options = {}) {
	let exePath = 'node ' + joplinAppPath;
	let cmd = exePath + ' --update-geolocation-disabled --env dev --profile ' + client.profileDir + ' ' + command;
	logger.info(client.id + ': ' + command);

	if (options.killAfter) {
		logger.info('Kill after: ' + options.killAfter);
	}

	return new Promise((resolve, reject) => {
		let childProcess = exec(cmd, (error, stdout, stderr) => {
			if (error) {
				if (error.signal == 'SIGTERM') {
					resolve('Process was killed');
				} else {
					logger.error(stderr);
					reject(error);
				}
			} else {
				resolve(stdout.trim());
			}
		});

		if (options.killAfter) {
			setTimeout(() => {
				logger.info('Sending kill signal...');
				childProcess.kill();
			}, options.killAfter);
		}
	});
}

async function clientItems(client) {
	let itemsJson = await execCommand(client, 'dump');
	try {
		return JSON.parse(itemsJson);
	} catch (error) {
		throw new Error('Cannot parse JSON: ' + itemsJson);
	}
}

function randomTag(items) {
	let tags = [];
	for (let i = 0; i < items.length; i++) {
		if (items[i].type_ != 5) continue;
		tags.push(items[i]);
	}

	return randomElement(tags);
}

function randomNote(items) {
	let notes = [];
	for (let i = 0; i < items.length; i++) {
		if (items[i].type_ != 1) continue;
		notes.push(items[i]);
	}

	return randomElement(notes);
}

async function execRandomCommand(client) {
	let possibleCommands = [
		['mkbook {word}', 40], // CREATE FOLDER
		['mknote {word}', 70], // CREATE NOTE
		[async () => { // DELETE RANDOM ITEM
			let items = await clientItems(client);
			let item = randomElement(items);
			if (!item) return;

			if (item.type_ == 1) {
				return execCommand(client, 'rm -f ' + item.id);
			} else if (item.type_ == 2) {
				return execCommand(client, 'rm -r -f ' + item.id);
			} else if (item.type_ == 5) {
				// tag
			} else {
				throw new Error('Unknown type: ' + item.type_);
			}
		}, 30],
		[async () => { // SYNC
			let avgSyncDuration = averageSyncDuration();
			let options = {};
			if (!isNaN(avgSyncDuration)) {
				if (Math.random() >= 0.5) {
					options.killAfter = avgSyncDuration * Math.random();
				}
			}
			return execCommand(client, 'sync --random-failures', options);
		}, 30],
		[async () => { // UPDATE RANDOM ITEM
			let items = await clientItems(client);
			let item = randomNote(items);
			if (!item) return;

			return execCommand(client, 'set ' + item.id + ' title "' + randomWord() + '"');
		}, 50],
		[async () => { // ADD TAG
			let items = await clientItems(client);
			let note = randomNote(items);
			if (!note) return;

			let tag = randomTag(items);
			let tagTitle = !tag || Math.random() >= 0.9 ? 'tag-' + randomWord() : tag.title;
			
			return execCommand(client, 'tag add ' + tagTitle + ' ' + note.id);
		}, 50],
	];

	let cmd = null;
	while (true) {
		cmd = randomElement(possibleCommands);
		let r = 1 + Math.floor(Math.random() * 100);
		if (r <= cmd[1]) break;
	}

	cmd = cmd[0];

	if (typeof cmd === 'function') {
		return cmd();
	} else {
		cmd = cmd.replace('{word}', randomWord());
		return execCommand(client, cmd);
	}
}

function averageSyncDuration() {
	return lodash.mean(syncDurations);
}

function randomNextCheckTime() {
	let output = time.unixMs() + 1000 + Math.random() * 1000 * 120;
	logger.info('Next sync check: ' + time.unixMsToIso(output) + ' (' + (Math.round((output - time.unixMs()) / 1000)) + ' sec.)');
	return output;
}

function findItem(items, itemId) {
	for (let i = 0; i  < items.length; i++) {
		if (items[i].id == itemId) return items[i];
	}
	return null;
}

function compareItems(item1, item2) {
	let output = [];
	for (let n in item1) {
		if (!item1.hasOwnProperty(n)) continue;
		if (n == 'sync_time') continue;
		let p1 = item1[n];
		let p2 = item2[n];

		if (n == 'notes_') {
			p1.sort();
			p2.sort();
			if (JSON.stringify(p1) !== JSON.stringify(p2)) {
				output.push(n);
			}
		} else {
			if (p1 !== p2) output.push(n);
		}
	}
	return output;
}

function findMissingItems_(items1, items2) {
	let output = [];

	for (let i = 0; i < items1.length; i++) {
		let item1 = items1[i];
		let found = false;
		for (let j = 0; j < items2.length; j++) {
			let item2 = items2[j];
			if (item1.id == item2.id) {
				found = true;
				break;
			}
		}

		if (!found) {
			output.push(item1);
		}
	}

	return output;
}

function findMissingItems(items1, items2) {
	return [
		findMissingItems_(items1, items2),
		findMissingItems_(items2, items1),
	];
}

async function compareClientItems(clientItems) {
	let itemCounts = [];
	for (let i = 0; i < clientItems.length; i++) {
		let items = clientItems[i];
		itemCounts.push(items.length);
	}
	logger.info('Item count: ' + itemCounts.join(', '));
	
	let missingItems = findMissingItems(clientItems[0], clientItems[1]);
	if (missingItems[0].length || missingItems[1].length) {
		logger.error('Items are different');
		logger.error(missingItems);
		process.exit(1);
	}

	let differences = [];
	let items = clientItems[0];
	for (let i = 0; i < items.length; i++) {
		let item1 = items[i];
		for (let clientId = 1; clientId < clientItems.length; clientId++) {
			let item2 = findItem(clientItems[clientId], item1.id);
			if (!item2) {
				logger.error('Item not found on client ' + clientId + ':');
				logger.error(item1);
				process.exit(1);
			}

			let diff = compareItems(item1, item2);
			if (diff.length) {
				differences.push({
					item1: JSON.stringify(item1),
					item2: JSON.stringify(item2),
				});
			}
		}
	}

	if (differences.length) {
		logger.error('Found differences between items:');
		logger.error(differences);
		process.exit(1);
	}
}

async function main(argv) {
	await fs.remove(syncDir);
	
	let clients = await createClients();
	let activeCommandCounts = [];
	let clientId = 0;

	for (let i = 0; i < clients.length; i++) {
		clients[i].activeCommandCount = 0;
	}

	function handleCommand(clientId) {
		if (clients[clientId].activeCommandCount >= 1) return;

		clients[clientId].activeCommandCount++;

		execRandomCommand(clients[clientId]).catch((error) => {
			logger.info('Client ' + clientId + ':');
			logger.error(error);
		}).then((r) => {
			if (r) {
				logger.info('Client ' + clientId + ":\n" + r.trim())
			}
			clients[clientId].activeCommandCount--;
		});
	}

	let nextSyncCheckTime = randomNextCheckTime();
	let state = 'commands';

	setInterval(async () => {
		if (state == 'waitForSyncCheck') return;

		if (state == 'syncCheck') {
			state = 'waitForSyncCheck';
			let clientItems = [];
			// Up to 3 sync operations must be performed by each clients in order for them
			// to be perfectly in sync - in order for each items to send their changes
			// and get those from the other clients, and to also get changes that are
			// made as a result of a sync operation (eg. renaming a folder that conflicts
			// with another one).
			for (let loopCount = 0; loopCount < 3; loopCount++) {
				for (let i = 0; i < clients.length; i++) {
					let beforeTime = time.unixMs();
					await execCommand(clients[i], 'sync');
					syncDurations.push(time.unixMs() - beforeTime);
					if (syncDurations.length > 20) syncDurations.splice(0, 1);
					if (loopCount === 2) {
						let dump = await execCommand(clients[i], 'dump');
						clientItems[i] = JSON.parse(dump);
					}
				}
			}

			await compareClientItems(clientItems);

			nextSyncCheckTime = randomNextCheckTime();
			state = 'commands';
			return;
		}

		if (state == 'waitForClients') {
			for (let i = 0; i < clients.length; i++) {
				if (clients[i].activeCommandCount > 0) return;
			}

			state = 'syncCheck';
			return;
		}

		if (state == 'commands') {
			if (nextSyncCheckTime <= time.unixMs()) {
				state = 'waitForClients';
				return;
			}

			handleCommand(clientId);
			clientId++;
			if (clientId >= clients.length) clientId = 0;
		}
	}, 100);
}

main(process.argv).catch((error) => {
	logger.error(error);
});