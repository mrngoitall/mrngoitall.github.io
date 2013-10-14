---
layout: post
title: "Best practices on deploying Node.js to AWS EC2"
date: 2013-10-13 15:01
comments: true
categories: aws ec2 nodejs security

---

So you've reached v1.0 of your Node.js-based project, and you're ready to deploy. Congratulations! One of the many ways you can deploy a Node.js project these days is via Amazon Web Service's Elastic Cloud Compute (EC2). There's others, such as Heroku and Nodejitsu.  Amazon actually even has another service that helps you deploy Node.js applications using their services, called Elastic Beanstalk. In theory, it's great; you simply install their CLI tools, run 'eb init', and you're on your way to quickly deploying your application based on your latest git commit. In practice, I haven't had much success with it due to node dependencies not installing properly, and I've had to launch my own VM to set up Mongodb anyway (since Amazon doesn't offer a simple service like Amazon RDS to easily set up a NoSQL database aside from their own DynamoDB), so I've also set up a VM dedicated to Node.js. In fact, my good friend Matt Goo even wrote a blog post that walks you through the steps I've used in my deployments [here](http://mattgoo.com/blog/?p=83). Once you've gotten node set up, there's a few more things to keep in mind in your deployment. <!-- more -->

## Git
Possibly one of the best ways of deploying your application is via Git. Once you have Git installed on your server, simply clone your repository from there, run 'npm install', and you're ready to go with a fresh copy of your code. This also gives you the flexibility to checkout a tagged version of your repo and launch that version instead. This means you can easily rollback in case there's any critical bug in the deployed code (ideally, you'd never get to that point, of course, but it's nice having that option available, just in case).

## Environment Variables
Hopefully you haven't been committing information about your database connection (such as the username, password, database connection string, etc.) and API keys/secrets in your actual code repositories. If you have, follow the directions in [this Github article on removing sensitive information](https://help.github.com/articles/remove-sensitive-data). Environment variables give you the ability to separate these bits of sensitive information from your code. To get started, create a new file (we'll call it **prod.env**) like so: 

``` bash prod.env
# If your db requires authentication, you could include the credentials in this connection string
export COW_DB_HOST=mongodb://localhost/cow
export NODE_ENV=production
export PORT=8080
# These are fake keys/secrets for the sake of showing you the format
export FB_CLIENT_ID=829459018483923
export FB_CLIENT_SECRET=8ds93jdf9e9d0esdf9e03kds0sd939d9
export GOOGLE_CLIENT_KEY=209432958010.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=D9Dke9mSie92kX9KeX0wk
export GITHUB_CLIENT_ID=09sdf03d0024dsjjkn3d
export GITHUB_CLIENT_SECRET=0239ds903nd93ix93nwroino3kj435jkn634vg24
export TWITTER_CONSUMER_KEY=0sd9f3js90334xd093nnsi
export TWITTER_CONSUMER_SECRET=09usdf903jd9034ERDS93rs93JSW9ds9d0s0dsSJSeSde
```

Save this somewhere outside of your repository, like your home directory, so you don't ever accidentally commit it to a repo. In your .bash_profile/.profile in your home directory, append 

    source /path/to/prod.env

Type that same command into your terminal to have these environment variables available in your current terminal session. In your server-side js files, simply use process.env.ENVIRONMENT_VARIABLE wherever you want to refer to those values. For instance: 

``` javascript Configuring passport-google-oauth with environment variables
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://cow.moo/auth/google/callback'
  },
  function(...) {
    ...
  }
));
```


## Privileged Ports
Once you actually set up node, and you're ready to launch a production instance of node on port 80, you might notice an issue. You can't simply run 'node server.js' under a normal user. You might be confused because you've been able to run 'node server.js' on your development machine under port 3000, 8080, 9000, etc. all this time without having to run it with 'sudo'. This is actually because ports 0-1023 on UNIX/Linux are considered [Privileged Ports](http://www.cyberciti.biz/faq/linux-unix-open-ports/) and require root/super user privileges. 

But wait. You really shouldn't be running node with root/super user privileges. What happens if someone decides to exploit a security vulnerability in your code (or node itself)? They'd be able to execute malicious code on your server with root privileges! Obviously not a good idea. 

What else can you do? Start using [iptables](http://blog.softlayer.com/2011/iptables-tips-and-tricks-port-redirection/). It allows you to reroute traffic from one port to another. In this case, we want to route traffic headed to our server on port 8080 (defined in our $PORT environment variable) to the standard http port 80. 

    sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports $PORT
     
If our server also supports SSL, we'll want to reroute our SSL traffic as well: 

    sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports $SSLPORT
     
Once you run these commands, these rules will persist until your server restarts. If you want these rules to persist on start-up, see the **Configuration on startup** section of [Ubuntu's iptables article](https://help.ubuntu.com/community/IptablesHowTo). 

## Forever
If you're remotely logging into your EC2 instance via SSH to launch node manually, you may have noticed that node quits the moment you exit the terminal. It also prevents you from running any other commands in the same terminal session. you could run

    nohup node server.js > node-output.log &
    
This works, for the most part, until node itself crashes when your application encounters an exception. At that point, you'd have to log back in to restart the node server using the same command. 

This is where [Forever](http://blog.nodejitsu.com/keep-a-nodejs-server-up-with-forever) comes in. Forever is used at Nodejitsu to keep servers running by turning the node process into a daemon, and it works really well for deployments to EC2 too. Setting it up is as simple as: 

    [sudo] npm install forever
    forever start server.js

If you set up your server with Git, pushing to production can be as simple as committing to your main repository, and then running: 

    git pull origin master
    forever restart server.js

## More?
This list is meant to be a starting point for people deploying their applications by setting up and configuring their own VMs, rather than using Heroku, Nodejitsu, or Elastic Beanstalk. If you know of some other good practices for deploying Node.js, feel free to share in the comments below! 

