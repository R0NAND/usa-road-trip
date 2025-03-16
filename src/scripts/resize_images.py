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
import time

# Batch process the images
def batch_resize_images(photos_list, quality=80, target_width=1000):
    for photo_data in photos_list:
        try:
            print(f"Processing: {photo_data['public_id']}")

            # Get the original image details
            image_info = cloudinary.api.resource(photo_data['public_id'])
            width = image_info['width']
            height = image_info['height']
            secure_url = image_info['secure_url']

            # Determine orientation and resize accordingly
            if width > height:
                # Landscape - Set width to target_width
                transformation = {"width": target_width, "quality": quality}
            else:
                # Portrait - Set width to target_width (height adjusts automatically)
                transformation = {"height": target_width, "quality": quality}

            # Overwrite original with resized and compressed version
            if(width > target_width + 100):
              cloudinary.uploader.upload(
                  secure_url,
                  public_id=photo_data['public_id'],  # Overwrite the existing asset
                  overwrite=True,
                  **transformation
              )
            else:
                print(f"✅ Skipping {photo_data['public_id']} as it is already small enough")

            print(f"✅ Successfully resized: {photo_data['public_id']}")
        except Exception as e:
            print(f"❌ Failed to resize {photo_data['public_id']}: {e}")

        # Optional delay to avoid rate limits
        time.sleep(0.5)

if __name__ == "__main__":
    locations = [
              #  'Entering_Detroit', 'Ann_Arbor', 'Toledo_Suburb', 'Indiannapolis_Wal-Mart', 'Nashville_Indiana', 'Mammoth_Cave',
              #  'Nashville', 'Outdoor_World', 'Smoky_Mountains', 'Atlanta', 'Savannah_Farm', 'Jacksonville', 
              #  'Universal_Studios_Orlando', 'Disney_Animal_Kingdom', 'Disney_Magic_Kingdom', 'Disney_Epcot',
              #  'Florida_Everglades', 'Key_West', 'Port_Charlotte', 'Tampa', 'Florida_Campsite', 'New_Orleans',
              #  'Texas_Wal-Mart', 'Houston', 'Austin', 'San_Antonio', 'Fort_Clark_Campsite', 'Marathon_Texas',
              #  'Big_Bend', 'BLM_Campsite', 'Carlsbad_Caverns', 
              #  'Guadalupe_Mountains', 'White_Sands', 'Dog_Canyon',
              #  'Very_Large_Array', 'Los_Alamos', 'Mesa_Verde', 'Ship_Rock', 'Flagstaff', 'Sedona', 'Grand_Canyon',
              #  'Bryce_Canyon', 'Kodachrome_Park', 'Capitol_Reef', 'Larb_Hollow_Overlook', 'Zion_Park', 'Natural_Bridges',
              #  'Arches_Park', 'Canyonlands', 'Black_Canyon_of_the_Gunnison', 'Aspen', 'Denver', 'Boulder', 
              #  'Rocky_Mountains_National_Park', 'Grand_Teton_National_Park', 'Yellowstone', 'Idaho_Hostel', 
              #  'Salt_Lake_City', 'Antelope_Island', 'Bonneville_Salt_Flats', 'Great_Basin_National_Park', 'Lake_Tahoe',
              #  'Road_To_Yosemite', 'Yosemite', "Sequioa_and_King's_Canyon", 'Los_Angeles', 'Universal_Studios_Hollywood',
              #  'Pinnacles_National_Park', 'Big_Sur', 'San_Francisco', 'Redwoods', "Thor's_Well", 'Cannon_Beach', 
              #  'Washington_Campground', 'Seattle', 'Glacier_National_Park', 'Black_Hills', 'Badlands',
               'Chicago', 'Exiting_Through_Detroit'
               ]
    for location in locations:
      photos = cloudinary.api.resources_by_tag(location, max_results=100, resource_type="image")['resources']
      batch_resize_images(photos)
