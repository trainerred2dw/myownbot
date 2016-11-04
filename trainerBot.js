(function () {

    /*window.onerror = function() {
        var room = JSON.parse(localStorage.getItem("trainerBotRoom"));
        window.location = 'https://plug.dj' + room.name;
    };*/
API.on(API.CHAT_COMMAND, (e) => {
    if (e === '/ezskip nsfw')
        setTimeout(() => {
            if (API.getDJ() === undefined)
                API.sendChat('@' + API.getHistory[0].user.username + ' please do not play NSFW songs. (Inappropriate, or songs that contain 4 or more swears in them)');
            else
                API.sendChat('@' + API.getHistory[1].user.username + ' please do not play NSFW songs. (Inappropriate, or songs that contain 4 or more swears in them)');
        }, 2500);
    else if (e === '/ezskip earrape')
        setTimeout(() => {
            if (API.getDJ() === undefined)
                API.sendChat('!alert ' + API.getHistory[0].user.username + ' (' + API.getHistory[0].user.id + ') played earrape');
            else
                API.sendChat('!alert ' + API.getHistory[1].user.username + ' (' + API.getHistory[1].user.id + ') played earrape');
        }, 2500);
});
