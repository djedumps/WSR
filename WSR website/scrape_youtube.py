import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def get_channel_videos(channel_url):
    """Scrape YouTube channel for video information"""
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    try:
        response = requests.get(channel_url, headers=headers)
        response.raise_for_status()
        
        # Extract JSON data from YouTube page
        html_content = response.text
        
        # Find the ytInitialData variable
        pattern = r'var ytInitialData = ({.*?});'
        match = re.search(pattern, html_content, re.DOTALL)
        
        if match:
            data = json.loads(match.group(1))
            
            # Navigate through YouTube's data structure
            videos = []
            
            # Try to find videos in the data structure
            try:
                tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
                
                for tab in tabs:
                    if 'tabRenderer' in tab:
                        tab_content = tab['tabRenderer'].get('content', {})
                        
                        if 'richGridRenderer' in tab_content:
                            contents = tab_content['richGridRenderer'].get('contents', [])
                            
                            for item in contents:
                                if 'richItemRenderer' in item:
                                    video_data = item['richItemRenderer']['content']['videoRenderer']
                                    
                                    video_info = {
                                        'title': video_data.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown'),
                                        'videoId': video_data.get('videoId', ''),
                                        'publishedTime': video_data.get('publishedTimeText', {}).get('simpleText', ''),
                                        'viewCount': video_data.get('viewCountText', {}).get('simpleText', ''),
                                        'thumbnail': video_data.get('thumbnail', {}).get('thumbnails', [{}])[-1].get('url', ''),
                                        'duration': video_data.get('lengthText', {}).get('simpleText', '')
                                    }
                                    
                                    videos.append(video_info)
                
                return videos[:30]  # Return first 30 videos
                
            except Exception as e:
                print(f"Error parsing video data: {e}")
                return []
        
        return []
        
    except Exception as e:
        print(f"Error fetching channel: {e}")
        return []

def extract_artist_and_title(video_title):
    """Extract artist name and track title from video title"""
    
    # Common patterns in music video titles
    patterns = [
        r'^(.+?)\s*[-–—]\s*(.+?)(?:\s*\[.*?\]|\s*\(.*?\))?$',  # Artist - Title
        r'^(.+?)\s*[–—]\s*(.+?)$',  # Artist – Title
        r'^(.+?)\s*:\s*(.+?)$',  # Artist : Title
    ]
    
    for pattern in patterns:
        match = re.search(pattern, video_title)
        if match:
            artist = match.group(1).strip()
            title = match.group(2).strip()
            
            # Remove common suffixes
            title = re.sub(r'\s*\[.*?\]$', '', title)
            title = re.sub(r'\s*\(.*?\)$', '', title)
            
            return artist, title
    
    # If no pattern matches, use the whole title
    return "Unknown Artist", video_title

def guess_genre(title):
    """Guess genre based on title keywords"""
    
    title_lower = title.lower()
    
    genre_keywords = {
        'Progressive House': ['progressive', 'prog house', 'melodic'],
        'Techno': ['techno', 'tech house'],
        'Trance': ['trance', 'uplifting', 'psy'],
        'House': ['house', 'deep house'],
        'Future Bass': ['future bass', 'future'],
        'Dubstep': ['dubstep', 'bass'],
        'Drum & Bass': ['drum and bass', 'dnb', 'd&b'],
        'Synthwave': ['synthwave', 'retro'],
        'Ambient': ['ambient', 'chill'],
    }
    
    for genre, keywords in genre_keywords.items():
        if any(keyword in title_lower for keyword in keywords):
            return genre
    
    return 'Electronic'

def generate_javascript_data(videos):
    """Generate JavaScript data from video information"""
    
    tracks = []
    artists_dict = {}
    
    for i, video in enumerate(videos, 1):
        artist, title = extract_artist_and_title(video['title'])
        genre = guess_genre(video['title'])
        
        # Clean view count
        views = video.get('viewCount', '0 views')
        views = views.replace(' views', '').replace(',', '')
        
        try:
            view_count = int(views)
            if view_count >= 1000000:
                plays = f"{view_count / 1000000:.1f}M"
            elif view_count >= 1000:
                plays = f"{view_count / 1000:.1f}K"
            else:
                plays = str(view_count)
        except:
            plays = '0'
        
        # Create track entry
        track = {
            'number': i,
            'title': title,
            'artist': artist,
            'genre': genre,
            'date': video.get('publishedTime', 'Unknown'),
            'plays': plays,
            'duration': video.get('duration', '0:00'),
            'bpm': 128,  # Default BPM
            'artwork': video.get('thumbnail', ''),
            'videoId': video.get('videoId', '')
        }
        
        tracks.append(track)
        
        # Aggregate artist data
        if artist not in artists_dict:
            artists_dict[artist] = {
                'name': artist,
                'tracks': 0,
                'genres': set(),
                'totalViews': 0
            }
        
        artists_dict[artist]['tracks'] += 1
        artists_dict[artist]['genres'].add(genre)
        
        try:
            artists_dict[artist]['totalViews'] += int(views)
        except:
            pass
    
    # Convert artists to list
    artists = []
    for artist_name, artist_data in artists_dict.items():
        
        total_views = artist_data['totalViews']
        if total_views >= 1000000:
            followers = f"{total_views / 1000000:.0f}K"
            streams = f"{total_views / 100000:.0f}M"
        else:
            followers = f"{total_views / 1000:.0f}K"
            streams = f"{total_views / 10000:.0f}M"
        
        artist = {
            'name': artist_name,
            'genres': list(artist_data['genres'])[:2],
            'bio': f'Electronic music producer signed to World Studio Records.',
            'image': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
            'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            'tracks': artist_data['tracks'],
            'followers': followers,
            'streams': streams,
            'country': '🌍 Global'
        }
        
        artists.append(artist)
    
    return {
        'tracks': tracks,
        'artists': artists
    }

def main():
    print("Scraping World Studio Records YouTube channel...")
    
    channel_url = "https://www.youtube.com/@worldstudiorecords/videos"
    
    videos = get_channel_videos(channel_url)
    
    if videos:
        print(f"Found {len(videos)} videos")
        
        data = generate_javascript_data(videos)
        
        # Save to JSON
        with open('youtube_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Data saved to youtube_data.json")
        print(f"Tracks: {len(data['tracks'])}")
        print(f"Artists: {len(data['artists'])}")
        
        # Print sample
        if data['tracks']:
            print("\nSample tracks:")
            for track in data['tracks'][:5]:
                print(f"  - {track['artist']} - {track['title']} ({track['genre']})")
        
    else:
        print("No videos found. The page structure might have changed.")
        print("Please provide video information manually.")

if __name__ == "__main__":
    main()
