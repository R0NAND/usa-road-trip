# Set your Cloudinary credentials
# ==============================
from dotenv import load_dotenv
load_dotenv()

# Import the Cloudinary libraries
# ==============================
import cloudinary
from cloudinary import CloudinaryImage
import cloudinary.uploader
import cloudinary.api

import json

import os
import csv
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

from datetime import datetime

def get_exif_data(image):
    exif_data = {}
    info = image._getexif()
    if info:
        for tag, value in info.items():
            decoded = TAGS.get(tag, tag)
            exif_data[decoded] = value
    return exif_data

def get_if_exist(data, key):
    return data.get(key)

def convert_to_degrees(value):
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)

def get_gps_info(exif_data):
    gps_info = {}
    altitude = None
    if 'GPSInfo' in exif_data:
        for key in exif_data['GPSInfo'].keys():
            decoded = GPSTAGS.get(key, key)
            gps_info[decoded] = exif_data['GPSInfo'][key]

        if 'GPSLatitude' in gps_info and 'GPSLatitudeRef' in gps_info and 'GPSLongitude' in gps_info and 'GPSLongitudeRef' in gps_info:
            lat = convert_to_degrees(gps_info['GPSLatitude'])
            if gps_info['GPSLatitudeRef'] != 'N':
                lat = -lat

            lon = convert_to_degrees(gps_info['GPSLongitude'])
            if gps_info['GPSLongitudeRef'] != 'E':
                lon = -lon
            else:
                lat, lon = None, None

            if 'GPSAltitude' in gps_info:
                altitude = gps_info['GPSAltitude']
            if 'GPSAltitudeRef' in gps_info and gps_info['GPSAltitudeRef'] == 1:
                altitude = -altitude  # If reference is 1, the altitude is below sea level
            
            if(altitude != None):
                return lat, lon, int(altitude)
            else:
                return lat, lon, None
    return None, None, None

def extract_info_from_image(image_path):
    image = Image.open(image_path)
    exif_data = get_exif_data(image)
    gps_lat, gps_lon, gps_alt = get_gps_info(exif_data)
    timestamp = get_if_exist(exif_data, 'DateTime')
    return gps_lat, gps_lon, gps_alt, timestamp

output_data = []
def process_directory(directory):
    failed_files = ''
    for file in os.listdir(directory):
        if file.lower().endswith('.jpg') or file.lower().endswith('.jpeg'):
            metadata_string = ''
            file_path = os.path.join(directory, file)
            lat, lon, alt, timestamp = extract_info_from_image(file_path)
            if(lat != None):
                metadata_string += 'latitude=' + str(lat) + '|'
            if(lon != None):
                metadata_string += 'longitude=' + str(lon) + '|'
            if(alt != None):
                metadata_string += 'altitude=' + str(alt) + '|'
            metadata_string += 'timestamp=' + timestamp
            print("uploading: " + os.path.join(directory, file))
            if(os.path.getsize(os.path.join(directory, file)) < 10485760):
                cloudinary.uploader.upload(os.path.join(directory, file), tags=[os.path.split(directory)[1]], 
                                        metadata=metadata_string)
                print("success!")
            else:
                failed_files += os.path.join(directory, file) + "\n"
    return failed_files

def write_to_csv(output_file, data):
    with open(output_file, 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(['Filepath', 'Latitude', 'Longitude', 'Timestamp'])
        csv_writer.writerows(data)

def output_gallery_string(directory):
    gallery_string = '<h2>' + os.path.basename(directory).replace("_", " ") + '</h2>\n<div class="justified-gallery">\n'
    for file in os.listdir(directory):
        if file.lower().endswith('.jpg') or file.lower().endswith('.jpeg'):
            file_path = os.path.join(directory, file)
            lat, lon, alt, timestamp = extract_info_from_image(file_path)
            if(lat != None):
                idx = file.index('.jp')
                thumbnail_name = file[:idx] + '_thumbnail' + file[idx:]
                gallery_string += '<a><img src="' + os.path.join(directory, 'thumbnails', thumbnail_name) + '" onmouseenter="test_func([' + str(lat) + ',' + str(lon) + '])"/></a>\n'

    gallery_string += "</div>\n"
    return gallery_string

from datetime import datetime
def rank_by_timestamp(resources):
  ranks = []
  timestamps = []
  for resource in resources['resources']:
      timestamps.append(datetime.strptime(resource['metadata']['timestamp'], "%Y:%m:%d %H:%M:%S"))
  
  print(timestamps)
  ranks.append(0)
  for i in range(1, (len(timestamps))):
      i_rank = 0
      for j in range(0, i):
          if(timestamps[i] > timestamps[j]):
              i_rank += 1
          else:
              ranks[j] += 1
      ranks.append(i_rank)
  return ranks

                
            
            
        

if __name__ == '__main__':
  locations = ['Entering_Detroit', 
               'Ann_Arbor', 'Toledo_Suburb', 'Indiannapolis_Wal-Mart', 'Nashville_Indiana', 'Mammoth_Cave',
               'Nashville', 'Outdoor_World', 'Smoky_Mountains', 'Atlanta', 'Savannah_Farm', 'Jacksonville', 
               'Universal_Studios_Orlando', 'Disney_Animal_Kingdom', 'Disney_Magic_Kingdom', 'Disney_Epcot',
               'Florida_Everglades', 'Key_West', 'Port_Charlotte', 'Tampa', 'Florida_Campsite', 'New_Orleans',
               'Texas_Wal-Mart', 'Houston', 'Austin', 'San_Antonio', 'Fort_Clark_Campsite', 'Marathon_Texas',
               'Big_Bend', 'BLM_Campsite', 'Carlsbad_Caverns', 'Guadalupe_Mountains', 'White_Sands', 'Dog_Canyon',
               'Very_Large_Array', 'Los_Alamos', 'Mesa_Verde', 'Ship_Rock', 'Flagstaff', 'Sedona', 'Grand_Canyon',
               'Bryce_Canyon', 'Kodachrome_Park', 'Capitol_Reef', 'Larb_Hollow_Overlook', 'Zion_Park', 'Natural_Bridges',
               'Arches_Park', 'Canyonlands', 'Black_Canyon_of_the_Gunnison', 'Aspen', 'Denver', 'Boulder', 
               'Rocky_Mountains_National_Park', 'Grand_Teton_National_Park', 'Yellowstone', 'Idaho_Hostel', 
               'Salt_Lake_City', 'Antelope_Island', 'Bonneville_Salt_Flats', 'Great_Basin_National_Park', 'Lake_Tahoe',
               'Road_To_Yosemite', 'Yosemite', "Sequioa_and_King's_Canyon", 'Los_Angeles', 'Universal_Studios_Hollywood',
               'Pinnacles_National_Park', 'Big_Sur', 'San_Francisco', 'Redwoods', "Thor's_Well", 'Cannon_Beach', 
               'Washington_Campground', 'Seattle', 'Glacier_National_Park', 'Black_Hills', 'Badlands',
               'Chicago', 'Exiting_Through_Detroit'
               ]
  photo_data = []
  root_url = "https://res.cloudinary.com/dc2bifl6p/image/upload/"
  for location in locations:
    result = cloudinary.api.resources_by_tag(location, max_results=100)
    data = json.loads(json.dumps(result))
    print(data)
    ranks = rank_by_timestamp(data)
    for rank in ranks:
      asset = data['resources'][rank]
      print(asset)
      url = asset['url']
      idx = url.index('upload/')
      caption = " "
      try:
          caption = asset['metadata']['caption']
      except:
          pass
      thumbnail_url = url[:idx + 7] + 'w_100,q_80/' + url[(idx + 7):]
      icon_url = url[:idx + 7] + 'w_ 40,h_40,c_fill,q_80/' + url[(idx + 7):]
      pd = {
        "id": asset['public_id'],
        "root_url": root_url,
        "height": asset['height'],
        "width": asset['width'],
        "location": location,
        "description": caption,
        "longitude": float(asset['metadata']['longitude']),
        "latitude": float(asset['metadata']['latitude']),
        "timestamp": datetime.strptime(asset['metadata']['timestamp'], "%Y:%m:%d %H:%M:%S").isoformat()
        }
      photo_data.append(pd)
    with open('src/photo-data.json', 'w') as file:
        json.dump(photo_data, file, indent=4)
  print("succesfully completed!")
    