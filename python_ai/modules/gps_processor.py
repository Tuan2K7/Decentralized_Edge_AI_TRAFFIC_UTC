import math
import sys
import json
import subprocess

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371000.0
    phi1, lam1, phi2, lam2 = map(math.radians, [lat1, lon1, lat2, lon2])
    a = (math.sin((phi2 - phi1) / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin((lam2 - lam1) / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))

def extract_gps_from_video(video_path: str) -> list[dict] | None:
    print("🔍 Đang đọc GPS từ metadata video...")
    try:
        subprocess.run(["ffprobe", "-version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("⚠ ffprobe không tìm thấy. Cài ffmpeg: https://ffmpeg.org/download.html")
        return None

    meta_cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path]
    try:
        result = subprocess.run(meta_cmd, capture_output=True, text=True, check=True)
        meta = json.loads(result.stdout)
        tags = meta.get("format", {}).get("tags", {})
        location_str = tags.get("location") or tags.get("com.apple.quicktime.location.ISO6709", "")
        if location_str:
            import re
            m = re.search(r'([+-]\d+\.\d+)([+-]\d+\.\d+)', location_str)
            if m:
                gps_point = {"lat": float(m.group(1)), "lon": float(m.group(2))}
                duration = float(meta.get("format", {}).get("duration", 0))
                print(f"✅ GPS từ metadata: {gps_point['lat']}, {gps_point['lon']}")
                return [{"time_s": t, **gps_point, "speed": 0.0}
                        for t in [0, duration / 2, duration] if duration > 0]
    except Exception as e:
        print(f"⚠ Không đọc được global metadata: {e}")
    return None

def load_gps_from_gpx(gpx_path: str) -> list[dict]:
    try:
        import gpxpy
    except ImportError:
        print("❌ Cần cài gpxpy: pip install gpxpy")
        sys.exit(1)

    print(f"📍 Đọc GPS từ GPX: {gpx_path}")
    points = []
    with open(gpx_path, "r", encoding="utf-8") as f:
        gpx = gpxpy.parse(f)

    base_time = None
    for track in gpx.tracks:
        for seg in track.segments:
            for pt in seg.points:
                if pt.time is None: continue
                t = pt.time.timestamp()
                if base_time is None: base_time = t
                points.append({
                    "time_s": t - base_time,
                    "lat": pt.latitude,
                    "lon": pt.longitude,
                    "speed": (pt.speed or 0.0) * 3.6,
                })
    points.sort(key=lambda p: p["time_s"])
    print(f"✅ Đọc được {len(points)} GPS điểm từ GPX")
    return points

def interpolate_gps(gps_track: list[dict], time_s: float) -> dict:
    if not gps_track: return {"lat": 0.0, "lon": 0.0, "speed": 0.0}
    if time_s <= gps_track[0]["time_s"]: return gps_track[0]
    if time_s >= gps_track[-1]["time_s"]: return gps_track[-1]

    lo, hi = 0, len(gps_track) - 1
    while lo + 1 < hi:
        mid = (lo + hi) // 2
        if gps_track[mid]["time_s"] <= time_s: lo = mid
        else: hi = mid

    p1, p2 = gps_track[lo], gps_track[hi]
    dt = p2["time_s"] - p1["time_s"]
    if dt == 0: return p1

    ratio = (time_s - p1["time_s"]) / dt
    return {
        "lat":   p1["lat"]   + ratio * (p2["lat"]   - p1["lat"]),
        "lon":   p1["lon"]   + ratio * (p2["lon"]   - p1["lon"]),
        "speed": p1["speed"] + ratio * (p2["speed"] - p1["speed"]),
    }