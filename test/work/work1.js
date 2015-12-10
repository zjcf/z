self.addEventListener("message", function(msg){
    console.log("msg from page: ", msg);
    postMessage("fku2");
}, false);
