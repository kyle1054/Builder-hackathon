import type { MapPlace } from "@/constants/map-places";

export type MapCanvasProps = {
  place: MapPlace;
  interactive?: boolean;
  origin?: MapPlace;
  stops?: MapPlace[];
};
export const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";
export const MAPBOX_CONFIGURED = MAPBOX_TOKEN.startsWith("pk.");
const safeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

/** Same Mapbox renderer in web iframe and native WebView; no native SDK rebuild needed. */
export function mapDocument({
  place,
  interactive = false,
  origin,
  stops = [],
}: MapCanvasProps) {
  const settings = safeJson({
    token: MAPBOX_TOKEN,
    center: [place.longitude, place.latitude],
    zoom: place.span > 0.05 ? 11 : 12.5,
    name: place.name,
    interactive,
    points: origin
      ? [origin, ...stops, place].map((p) => ({
          name: p.name,
          coordinates: [p.longitude, p.latitude],
        }))
      : [],
  });
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.css" rel="stylesheet"><style>
  html,body,#map{margin:0;width:100%;height:100%;background:#E6EDE3}body{font-family:system-ui,sans-serif}#status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#5F6F65;font-size:13px;background:#E6EDE3;z-index:3}#status.error{inset:auto 12px 40px;padding:14px;border-radius:8px;background:#FFFFFF;color:#20392F}#recenter{position:absolute;top:112px;right:10px;width:30px;height:30px;background:#f5f1e8;border:0;border-radius:4px;font-size:20px;color:#111827;cursor:pointer;display:none}
  </style></head><body><div id="map" aria-label="Destination map"></div><div id="status" role="status">Loading map…</div><button id="recenter" aria-label="Recenter destination" title="Recenter destination">⌖</button>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.js"></script><script>
  const config=${settings};const status=document.getElementById('status');let timer;
  function fail(message){clearTimeout(timer);status.textContent=message;status.className='error';status.style.display='flex';}
  try {
    if(!window.mapboxgl||!mapboxgl.supported())throw new Error('Map rendering is unavailable on this device.');
    const map=new mapboxgl.Map({container:'map',accessToken:config.token,style:'mapbox://styles/mapbox/outdoors-v12',center:config.center,zoom:config.zoom,interactive:config.interactive,attributionControl:true,dragRotate:false,touchPitch:false});
    if(!config.points.length)new mapboxgl.Marker({color:'#B98643'}).setLngLat(config.center).addTo(map);
    const bounds=new mapboxgl.LngLatBounds();
    for(let i=0;i<config.points.length;i++){
      const point=config.points[i];bounds.extend(point.coordinates);
      const pin=document.createElement('button');pin.textContent=i===0?'A':i===config.points.length-1?'B':String(i);
      pin.setAttribute('aria-label',point.name);pin.style.cssText='width:32px;height:32px;border-radius:50%;border:2px solid #FFF5DF;background:#203D32;color:#FFF5DF;font-weight:700;box-shadow:0 2px 6px #0004;cursor:pointer';
      new mapboxgl.Marker({element:pin}).setLngLat(point.coordinates).setPopup(new mapboxgl.Popup({offset:20}).setText(point.name)).addTo(map);
    }
    const fit=()=>config.points.length?map.fitBounds(bounds,{padding:48,duration:0,maxZoom:14}):map.easeTo({center:config.center,zoom:config.zoom,duration:250});
    if(config.points.length)fit();
    if(config.interactive){map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right');const button=document.getElementById('recenter');button.style.display='block';button.onclick=fit;}
    timer=setTimeout(()=>fail('Map is taking longer to load. Check your connection and reopen it.'),20000);
    map.on('style.load',()=>{
      // SideQuest field-map palette: retain Mapbox geography, labels and attribution.
      for(const layer of map.getStyle().layers){
        const id=layer.id;const source=layer['source-layer']||'';
        if(layer.type==='background')map.setPaintProperty(id,'background-color','#DCE1CA');
        if(layer.type==='fill'){
          if(source==='water')map.setPaintProperty(id,'fill-color','#91B8BB');
          else if(source==='landuse'||source==='landcover')map.setPaintProperty(id,'fill-color',['match',['get','class'],'wood','#AEC3A1','scrub','#BECBB0','grass','#CBD7B7','park','#C0D0AC','agriculture','#DDDCC0','sand','#E8DDC4','#D3DCC4']);
          else if(source==='building')map.setPaintProperty(id,'fill-color','#B6B19A');
        }
        if(layer.type==='line'){
          if(source==='road')map.setPaintProperty(id,'line-color',/case/.test(id)?'#BEB89F':'#FFF5DF');
          if(source==='waterway')map.setPaintProperty(id,'line-color','#91B8BB');
          if(source==='contour')map.setPaintProperty(id,'line-color','#9BAE90');
        }
        if(layer.type==='symbol'&&layer.layout&&layer.layout['text-field']){
          map.setPaintProperty(id,'text-color','#3D5549');
          map.setPaintProperty(id,'text-halo-color','#F1F0DC');
          map.setPaintProperty(id,'text-halo-width',1.3);
        }
      }
    });
    map.on('load',async()=>{clearTimeout(timer);status.style.display='none';map.resize();fit();
      if(config.points.length){try{
        const coordinates=config.points.map(p=>p.coordinates.join(',')).join(';');
        const response=await fetch('https://api.mapbox.com/directions/v5/mapbox/driving/'+coordinates+'?geometries=geojson&overview=full&access_token='+encodeURIComponent(config.token));
        const data=await response.json();if(!response.ok||!data.routes?.[0])throw new Error('route');
        map.addSource('trip-route',{type:'geojson',data:{type:'Feature',properties:{},geometry:data.routes[0].geometry}});
        map.addLayer({id:'trip-route-line',type:'line',source:'trip-route',paint:{'line-color':'#365F50','line-width':5,'line-opacity':.85},layout:{'line-cap':'round','line-join':'round'}});
        for(const p of data.routes[0].geometry.coordinates)bounds.extend(p);fit();
      }catch(e){fail('Route unavailable. Showing stop locations only.');}}
    });
    map.on('error',(event)=>{const code=event.error&&event.error.status;fail(code===401||code===403?'Mapbox access was denied. Check the public token and its URL restrictions.':'The map could not load. Check your connection and reopen it.');});
    window.addEventListener('resize',()=>map.resize());window.addEventListener('pagehide',()=>{clearTimeout(timer);map.remove();});
  }catch(error){fail('Map rendering is unavailable. Check your connection or browser support.');}
  </script></body></html>`;
}
