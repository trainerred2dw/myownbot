(function () {

    /*window.onerror = function() {
        var room = JSON.parse(localStorage.getItem("trainerBotRoom"));
        window.location = 'https://plug.dj' + room.name;
    };*/

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(trainerBot.room.autodisableInterval);
        clearInterval(trainerBot.room.afkInterval);
        trainerBot.status = false;
    };

    // This socket server is used solely for statistical and troubleshooting purposes.
    // This server may not always be up, but will be used to get live data at any given time.

    /*var socket = function () {
        function loadSocket() {
            SockJS.prototype.msg = function(a){this.send(JSON.stringify(a))};
            sock = new SockJS('https://benzi.io:4964/socket');
            sock.onopen = function() {
                console.log('Connected to socket!');
                sendToSocket();
            };
            sock.onclose = function() {
                console.log('Disconnected from socket, reconnecting every minute ..');
                var reconnect = setTimeout(function(){ loadSocket() }, 60 * 1000);
            };
            sock.onmessage = function(broadcast) {
                var rawBroadcast = broadcast.data;
                var broadcastMessage = rawBroadcast.replace(/["\\]+/g, '');
                API.chatLog(broadcastMessage);
                console.log(broadcastMessage);
            };
        }
        if (typeof SockJS == 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js', loadSocket);
        } else loadSocket();
    }
    var sendToSocket = function () {
        var trainerBotSettings = trainerBot.settings;
        var trainerBotRoom = trainerBot.room;
        var basicBotInfo = {
            time: Date.now(),
            version: trainerBot.version
        };
        var data = {users:API.getUsers(),userinfo:API.getUser(),room:location.pathname,basicBotSettings:basicBotSettings,basicBotRoom:basicBotRoom,basicBotInfo:basicBotInfo};
        return sock.msg(data);
    };*/

    var storeToStorage = function () {
        localStorage.setItem("basicBotsettings", JSON.stringify(trainerBot.settings));
        localStorage.setItem("basicBotRoom", JSON.stringify(trainerBot.room));
        var basicBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: trainerBot.version
        };
        localStorage.setItem("basicBotStorageInfo", JSON.stringify(basicBotStorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://rawgit.com/trainerBot/source/master/lang/langIndex.json", function (json) {
            var link = trainerBot.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[trainerBot.settings.language.toLowerCase()];
                if (trainerBot.settings.chatLink !== trainerBot.chatLink) {
                    link = trainerBot.settings.chatLink;
                }
                else {
                    if (typeof link === "undefined") {
                        link = trainerBot.chatLink;
                    }
                }
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        trainerBot.chat = json;
                        cb();
                    }
                });
            }
            else {
                $.get(trainerBot.chatLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        trainerBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("basicBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                trainerBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("basicBotStorageInfo");
        if (info === null) API.chatLog(trainerBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("basicBotsettings"));
            var room = JSON.parse(localStorage.getItem("basicBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(trainerBot.chat.retrievingdata);
                for (var prop in settings) {
                    trainerBot.settings[prop] = settings[prop];
                }
                trainerBot.room.users = room.users;
                trainerBot.room.afkList = room.afkList;
                trainerBot.room.historyList = room.historyList;
                trainerBot.room.mutedUsers = room.mutedUsers;
                //trainerBot.room.autoskip = room.autoskip;
                trainerBot.room.roomstats = room.roomstats;
                trainerBot.room.messages = room.messages;
                trainerBot.room.queue = room.queue;
                trainerBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(trainerBot.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById("room-settings");
        info = roominfo.textContent;
        var ref_bot = "@trainerBot=";
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(" ") < link.indexOf("\n")) ind_space = link.indexOf(" ");
            else ind_space = link.indexOf("\n");
            link = link.substring(0, ind_space);
            $.get(link, function (json) {
                if (json !== null && typeof json !== "undefined") {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        trainerBot.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function (a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            }
            else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = "Yemasthui";
    var botMaintainer = "Benzi"
    var botCreatorIDs = ["3851534", "4105209"];

    var trainerBot = {
        version: "2.9.1",
        status: false,
        name: "trainerBot",
        loggedInID: null,
        scriptLink: "https://rawgit.com/trainerBot/source/master/trainerBot.js",
        cmdLink: "http://git.io/245Ppg",
        chatLink: "https://rawgit.com/trainerBot/source/master/lang/en.json",
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "trainerBot",
            language: "english",
            chatLink: "https://rawgit.com/trainerBot/source/master/lang/en.json",
            scriptLink: "https://rawgit.com/trainerBot/source/master/trainerBot.js",
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: true,
            autoskip: false,
            smartSkip: true,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: true,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: false,
            voteSkipLimit: 10,
            historySkip: false,
            timeGuard: true,
            maximumSongLength: 10,
            autodisable: false,
            commandCooldown: 30,
            usercommandsEnabled: true,
            thorCommand: false,
            thorCooldown: 10,
            skipPosition: 3,
            skipReasons: [
                ["theme", "This song does not fit the room theme. "],
                ["op", "This song is on the OP list. "],
                ["history", "This song is in the history. "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you contained was NSFW (image or sound). "],
                ["unavailable", "The song you played was not available for some users. "]
            ],
        room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            //autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function () {
                if (trainerBot.status && trainerBot.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = trainerBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < trainerBot.room.queue.id.length; i++) {
                            if (trainerBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            trainerBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(trainerBot.chat.alreadyadding, {position: trainerBot.room.queue.position[alreadyQueued]}));
                        }
                        trainerBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            trainerBot.room.queue.id.unshift(id);
                            trainerBot.room.queue.position.unshift(pos);
                        }
                        else {
                            trainerBot.room.queue.id.push(id);
                            trainerBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(trainerBot.chat.adding, {name: name, position: trainerBot.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },
            dclookup: function (id) {
                var user = trainerBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return trainerBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(trainerBot.chat.notdisconnected, {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return trainerBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (trainerBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = trainerBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(trainerBot.chat.toolongago, {name: trainerBot.userUtilities.getUser(user).username, time: time}));
                var songsPassed = trainerBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = trainerBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(trainerBot.chat.notdisconnected, {name: name});
                var msg = subChat(trainerBot.chat.valid, {name: trainerBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                trainerBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            afkCheck: function () {
                if (!trainerBot.status || !trainerBot.settings.afkRemoval) return void (0);
                var rank = trainerBot.roomUtilities.rankToNumber(trainerBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, trainerBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void (0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = trainerBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = trainerBot.userUtilities.getUser(user);
                            if (rank !== null && trainerBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = trainerBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = trainerBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > trainerBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(trainerBot.chat.warning1, {name: name, time: time}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    }
                                    else if (warncount === 1) {
                                        API.sendChat(subChat(trainerBot.chat.warning2, {name: name}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    }
                                    else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            trainerBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(trainerBot.chat.afkremove, {name: name, time: time, position: pos, maximumafk: basicBot.settings.maximumAfk}));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            smartSkip: function (reason) {
                var dj = API.getDJ();
                var id = dj.id;
                var waitlistlength = API.getWaitList().length;
                var locked = false;
                trainerBot.room.queueable = false;

                if (waitlistlength == 50) {
                    trainerBot.roomUtilities.booth.lockBooth();
                    locked = true;
                }
                setTimeout(function (id) {
                    API.moderateForceSkip();
                    setTimeout(function () {
                        if (typeof reason !== 'undefined') {
                            API.sendChat(reason);
                        }
                    }, 500);
                    trainerBot.room.skippable = false;
                    setTimeout(function () {
                        trainerBot.room.skippable = true
                    }, 5 * 1000);
                    setTimeout(function (id) {
                        trainerBot.userUtilities.moveUser(id, trainerBot.settings.skipPosition, false);
                        trainerBot.room.queueable = true;
                        if (locked) {
                            setTimeout(function () {
                                trainerBot.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }, 1500, id);
                }, 1000, id);
            },
			
            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(trainerBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = trainerBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (trainerBot.room.roomevent) {
                                    trainerBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(trainerBot.chat.invaliduserspecified, {name: chat.un}));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(trainerBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = trainerBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(trainerBot.chat.invaliduserspecified, {name: chat.un}));
                        trainerBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(trainerBot.chat.afkstatusreset, {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(trainerBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = trainerBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(trainerBot.chat.invaliduserspecified, {name: chat.un}));
                        var lastActive = trainerBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = trainerBot.roomUtilities.msToStr(inactivity);

                        var launchT = trainerBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline){
                            API.sendChat(subChat(trainerBot.chat.inactivelonger, {botname: trainerBot.settings.botName, name: chat.un, username: name}));
                        } else {
                        API.sendChat(subChat(trainerBot.chat.inactivefor, {name: chat.un, username: name, time: time}));
                        }
                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (trainerBot.settings.autoskip) {
                            trainerBot.settings.autoskip = !trainerBot.settings.autoskip;
                            clearTimeout(trainerBot.room.autoskipTimer);
                            return API.sendChat(subChat(trainerBot.chat.toggleoff, {name: chat.un, 'function': trainerBot.chat.autoskip}));
                        }
                        else {
                            trainerBot.settings.autoskip = !trainerBot.settings.autoskip;
                            return API.sendChat(subChat(trainerBot.chat.toggleon, {name: chat.un, 'function': trainerBot.chat.autoskip}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(trainerBot.chat.autowoot);
                    }
                }
            },

            forceskipCommand: {
                command: ['forceskip', 'fs'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(trainerBot.chat.forceskip, {name: chat.un}));
                        API.moderateForceSkip();
                        trainerBot.room.skippable = false;
                        setTimeout(function () {
                            trainerBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (trainerBot.settings.historySkip) {
                            trainerBot.settings.historySkip = !trainerBot.settings.historySkip;
                            API.sendChat(subChat(trainerBot.chat.toggleoff, {name: chat.un, 'function': trainerBot.chat.historyskip}));
                        }
                        else {
                            trainerBot.settings.historySkip = !trainerBot.settings.historySkip;
                            API.sendChat(subChat(trainerBot.chat.toggleon, {name: chat.un, 'function': trainerBot.chat.historyskip}));
                        }
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        //sendToSocket();
                        API.sendChat(trainerBot.chat.kill);
                        trainerBot.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = trainerBot.userUtilities.lookupUser(chat.uid);
                        var perm = trainerBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://youtu.be/" + media.cid;
                                API.sendChat(subChat(trainerBot.chat.songlink, {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat(trainerBot.chat.songlink, {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(trainerBot.chat.logout, {name: chat.un, botname: trainerBot.settings.botName}));
                        setTimeout(function () {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            trainerBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(trainerBot.chat.maxlengthtime, {name: chat.un, time: trainerBot.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat(trainerBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            skipCommand: {
                command: ['skip', 'smartskip'],
                rank: 'residentdj',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (trainerBot.room.skippable) {

                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var dj = API.getDJ();
                            var name = dj.username;
                            var msgSend = '@' + name + ', ';

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(trainerBot.chat.usedskip, {name: chat.un}));
                                if (trainerBot.settings.smartSkip && timeLeft > timeElapsed){
                                    trainerBot.roomUtilities.smartSkip();
                                }
                                else {
                                    API.moderateForceSkip();
                                }
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < trainerBot.settings.skipReasons.length; i++) {
                                var r = trainerBot.settings.skipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += trainerBot.settings.skipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(trainerBot.chat.usedskip, {name: chat.un}));
                                if (trainerBot.settings.smartSkip && timeLeft > timeElapsed){
                                    trainerBot.roomUtilities.smartSkip(msgSend);
                                }
                                else {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.sendChat(msgSend);
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (trainerBot.settings.welcome) {
                            trainerBot.settings.welcome = !trainerBot.settings.welcome;
                            return API.sendChat(subChat(trainerBot.chat.toggleoff, {name: chat.un, 'function': trainerBot.chat.welcomemsg}));
                        }
                        else {
                            trainerBot.settings.welcome = !trainerBot.settings.welcome;
                            return API.sendChat(subChat(trainerBot.chat.toggleon, {name: chat.un, 'function': trainerBot.chat.welcomemsg}));
                        }
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!trainerBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof trainerBot.settings.youtubeLink === "string")
                            API.sendChat(subChat(trainerBot.chat.youtube, {name: chat.un, link: trainerBot.settings.youtubeLink}));
                    }
                }
            }
        }
    };

    loadChat(trainerBot.startup);
}).call(this);
