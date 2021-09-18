
function lerp(x,a,b){
    return x*(a-b)+b;
}
function* ring(list){
    let i =0;
    while(true) yield list[i++%list.length];
}

function addVideo(data, dest){
    return;
    let v = document.createElement("video");
    v.loop=true;
    v.muted=true;
    //v.playbackRate = 2
    if("reddit_video" in data.media)
        v.src = data.media.reddit_video.fallback_url;
    else if(data.media.type.match('gif'))
        v.src = data.media.oembed.thumbnail_url.replace('jpg','mp4');    
    else if( "url" in data.media)
        v.src = data.media.url;
    else
        return; 
    v.play();
    dest.push(v);
}
function addImage(src,dest){
    const h = 600;
    let i = new Image();
    i.src=src
    //i.style.cssText = `max-width: 75%; max-height: 75%; display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`;
    //i.style.display="none";
    //dest.appendChild(i);
    dest.push(i);
}
function addGallery(data,dest){
    data.gallery_data.items.forEach(item=>{
        let meta = data.media_metadata[item.media_id]
        let url="https://i.redd.it/"+ meta.id +'.'+meta.m.split('/')[1];
        addImage(url,dest);
    });
}
function addMedia(data,dest){
    let url = data.url || ""
    if(url.match(/\.(jpg|jpeg|png|gif)$/)){
        addImage(url,dest);
        return true;
    }
    if("gallery_data" in data){
        addGallery(data,dest);
        return true;
    }
    if(data.media){
        addVideo(data,dest);
        return true;
    }
    return false;
    
}
async function addPages(subreddit, N=1, dest, after=""){
    if(N<=0) return after;
    let url = "https://www.reddit.com/r/" + subreddit + ".json"
    let resp = await fetch(url+after).then(r=>r.json()).then(j=>{
        let children = j.data.children;
        let after = `?after=${j.data.after}`;
        let p = addPages(subreddit, N-1, dest, after);
        children.forEach(c=>{
            addMedia(c.data,dest)
        });
        return p;
    });
}

function shuffle(list){
    let l = list.length;
    let temp;
    let r;
    for(let i=0; i<l;++i){
        r = Math.floor(Math.random()*(l-i))+i;
        temp = list[i];
        list[i]=list[r];
        list[r]=temp;
    }
}

function flash3(){
    if(document.body.bgColor == '#ff00ff')
        return document.body.bgColor='#ffffff'
    if(document.body.bgColor=='#ffffff')
        return document.body.bgColor = '#000000';
    document.body.bgColor = '#ff00ff';
}

function showImage(img,zoom=1){
    ctx.resetTransform();
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.translate(cv.width/2,cv.height/2);
    ctx.scale(zoom,zoom);
    let scale = Math.min(1,cv.height/img.height,cv.width/img.width);
    let xoff = (cv.width - img.width*scale)/2 - cv.width/2;
    let yoff = (cv.height - img.height*scale)/2 - cv.height/2;
    ctx.drawImage(img,xoff,yoff,img.width*scale,img.height*scale);
}

async function addSubs(subs,dest){
    let p = [];
    subs.forEach(x=>p.push(addPages(x[0], x[1], dest)));
    for(let pi of p)
        await pi;
    shuffle(dest);
}

function run(ms,zoom){
    let count=0;
    let tp = 0;
    const mspf = 1000/60
    ms =Math.floor(ms/mspf)*mspf;
    runstop=true;
    imgList.forEach(img=>showImage(img));
    function loop(t){
        if(t-tp>=ms){
            tp=t;
            ++count;
            if(!zoom){
                showImage(imgList[count%imgList.length],1);
            }
        }
        if(zoom)
            showImage(imgList[count%imgList.length],lerp((t-tp)/ms,1.1,.7));
        if(runstop)
            requestAnimationFrame(loop);
        else{
            ctx.resetTransform();
            ctx.clearRect(0,0,cv.width,cv.height);
        }
    }
    loop(0)
}

var imgList = [];
var cv = null;
var ctx = null;
var runstop = false;
async function clickAdd(){
    var it = document.createElement("li");
    var sub = document.getElementById("sub").value;
    var n = document.getElementById("pages").value
    document.getElementById("sub").value="";
    document.getElementById("pages").value = 1;
    it.textContent = `${sub}, ${n}`;
    await addPages(sub,n,imgList);
    document.getElementById("subs").append(it);
};
function clickBegin(){
    var ms = document.getElementById("ms").value;
    var zooming = document.getElementById("zoom").checked;
    shuffle(imgList);
    document.body = document.createElement('body');
    cv = document.createElement('canvas');
    cv.width =window.innerWidth - 20;
    cv.height = window.innerHeight-20;
    cv.style.cssText= "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: solid;"
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    run(ms,zooming);
}

