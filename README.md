# SiteSeer

My bot to track changes in websites. Was deployed at t.me/siteseer_bot previously, no longer hosted online. 

Coming from LinkedIn? Do check out the documentation below.

## Usecases

> For students

* Track exam form website
* Track student result website

> For devs

* Track pull requests page
* Update when an issue gets updated

## Commands

/start to get list of commands
/watch {sitename} to track a website
/unsub {sitename} to unsubscribe from a website
/list to get list of websites

## Contributors

[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/0)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/0)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/1)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/1)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/2)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/2)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/3)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/3)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/4)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/4)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/5)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/5)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/6)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/6)[![](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/images/7)](https://sourcerer.io/fame/akash-joshi/akash-joshi/SiteSeer-Website-Tracker/links/7)

## Components of the Bot

1. The actual bot, which accepts regex and gives output.
2. The site change checker, which converts the HTML of the site to a checksum and compares with prev checksum.
3. A cronjob which runs the site change function every 15 minutes.

## Getting Started

### Manual
#### 1. Pre-requisites :

1. Have a Mongo Database hosted locally or online.
2. Have node & npm installed, check `npm -v` to check your version.
3. Create a `.env` file containing based on this guide : [Link](https://github.com/akash-joshi/SiteSeer-Website-Tracker/blob/master/ENV.md)

#### 2. Running the code :

1. Clone this repository.
2. `cd` into it and run `npm i`.
3. Run `npm start` to start the server.

### Docker

1. Install docker-compose 
2. Create a `.env` file containing based on this guide : [Link](https://github.com/akash-joshi/SiteSeer-Website-Tracker/blob/master/ENV.md)
3. Run `docker-compose up`

## Tasklist

- [ ] Compare a screenshot of the website instead of complete HTML
- [X] Use JSSoup instead ?
- [ ] Send image with change notification, so user doesn't have to open site
- [ ] Split code into multiple files, abstract mongo, telegram

## Challenges

1. Web Dev Certificate Challenge - Create a beautiful frontend for the project to access functionality from the web.
2. NLP Certificate Challenge - Optimize the chatbot to understand multitudes of user input.
3. "Advanced" Programming Certificate Challenge - Optimize the code. Make it do more with less.
4. Machine Learning/AI/Image Recognition Certificate Challenge - Optimize the bot to check for changes based on image recognition.
