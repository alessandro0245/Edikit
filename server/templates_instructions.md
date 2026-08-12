How files are named in each project 🗃️

main_comp = main composition, final render output
background.png = background image
img_1.png = image
video_1 = video
sfx_1 = sound effect
nested_sequence_1 = pre-composition (folder containing groups of elements or scenes)
camera_1 = 3D camera
null_1 = null object
adjustment_1 = adjustment layer
txt_1 = text layer
shape_1 = shape layer

General Rules 📖

If a text field is left empty by the user, it just won’t appear in the final export.

If other fields are left empty by the user they will keep the appearance from the template preview.

Each text field has a maximum character limit, because overly long text would overflow the intended layout area.

Font must match the font uploaded in the “Animation\_” folder

Videos and images need to automatically fit to the project file’s dimensions (specified below for each animation)

The normal export settings for each vertical video are:
Format: H.264
Video Codec: H.264
Bitrate Encoding: VBR, 2 Pass
Target Bitrate: 15 Mbps
Max Bitrate: 20 Mbps

But if the user decides to remove the background, here’s what needs to be changed:
Format: QuickTime
Video Codec: Animation
Depth: Millions of Colors+ (RGB + Alpha)
Channels: RGB + Alpha

Instructions for each animation 📄

Animation_1:

main_comp
├── adjustment_1
├── null_2
├── null_1
├── camera_1
├── nested_sequence_2
│ ├── shape_7
│ ├── video_2.mp4 (1176x1058)
│ ├── img_2 (1080x1000)
│ ├── txt_2
│ ├── shape_6
│ └── shape_5
├── nested_sequence_1
│ ├── shape_4
│ ├── video_1.mp4 (1176x1058)
│ ├── img_1 (1080x1000)
│ ├── txt_1
│ ├── shape_3
│ └── shape_2
├── shape_1
├── background (2160x3840)
├── sfx_3
├── sfx_2
└── sfx_1

Fields the user can change and what they do:

adjustment_1: name it: “Camera Refocus Blur Effect” - Can be on or off, on: the adjustment layer is visible, off: not visible.

img_1 or video_1.mp4 : name it: “media 1” - The user can upload a video or image file. If it’s a video “img_1” becomes invisible, and if it’s an image “video_1”

txt_1: name it: “text 1” - The user can change the text (maximum length: 18 characters)

img_2 or video_2.mp4 : name it: “media 2” - The user can upload a video or image file. If it’s a video “img_2” becomes invisible, and if it’s an image “video_2”

txt_2: name it: “text 2” - The user can change the text (maximum length: 18 characters)

background: name it: “background” - The user can decide to remove the background
(if the background gets removed the export settings are written in General Rules)

Animation_2:

main_comp
├── adjustment_1
├── null_2
├── null_1
├── camera_1
├── nested_sequence_4
│ ├── shape_17
│ ├── video_4.mp4 (1040x1056)
│ ├── img_4 (1080x1080)
│ ├── txt_4
│ └── shape_16
├── nested_sequence_3
│ ├── shape_15
│ ├── video_3.mp4 (1040x1056)
│ ├── img_3 (1080x1080)
│ ├── txt_3
│ └── shape_14
├── nested_sequence_2
│ ├── shape_13
│ ├── video_2.mp4 (1040x1056)
│ ├── img_2 (1080x1080)
│ ├── txt_2
│ └── shape_12
├── shape_11
├── shape_10
├── shape_9
├── shape_8
├── shape_7
├── shape_6
├── shape_5
├── shape_4
├── shape_3
├── nested_sequence_1
│ ├── shape_2
│ ├── video_1.mp4 (1040x1056)
│ ├── img_1 (1080x1080)
│ ├── txt_1
│ └── shape_1
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:

adjustment_1: name it: “Camera Refocus Blur Effect” - Can be on or off, on: the adjustment layer is visible, off: not visible.

img_1 or video_1.mp4 : name it: “media 1” - The user can upload a video or image file. If it’s a video “img_1” becomes invisible, and if it’s an image “video_1”

txt_1: name it: “text 1” - The user can change the text (maximum length: 14 characters)

img_2 or video_2.mp4 : name it: “media 2” - The user can upload a video or image file. If it’s a video “img_2” becomes invisible, and if it’s an image “video_2”

txt_2: name it: “text 2” - The user can change the text (maximum length: 14 characters)
img_3 or video_3.mp4 : name it: "media 3" - The user can upload a video or image file. If it's a video, "img_3" becomes invisible, and if it's an image, "video_3" becomes invisible.
txt_3: name it: "text 3" - The user can change the text (maximum length: 14 characters)
img_4 or video_4.mp4 : name it: "media 4" - The user can upload a video or image file. If it's a video, "img_4" becomes invisible, and if it's an image, "video_4" becomes invisible.
txt_4: name it: "text 4" - The user can change the text (maximum length: 14 characters)
background: name it: “background” - The user can decide to remove the background
(if the background gets removed the export settings are written in General Rules)

Animation_3:

main_comp
├── adjustment_1
├── camera_ctrl_2
├── null_1
├── camera_1
├── nested_sequence_4
│ ├── shape_8
│ ├── img_4.png (1080x1000)
│ ├── txt_4
│ └── shape_7
├── nested_sequence_3
│ ├── shape_6
│ ├── video_1.mp4 (1176x1058)
│ ├── img_3.png (1080x1000)
│ ├── txt_3
│ └── shape_5
├── nested_sequence_2
│ ├── shape_4
│ ├── img_2.png (1080x1000)
│ ├── txt_2
│ └── shape_3
├── nested_sequence_1
│ ├── shape_2
│ ├── img_1.png (1080x1000)
│ ├── txt_1
│ └── shape_1
├── background.png (2160x3840)
├── sfx_1.wav
└── sfx_2.wav

Fields the user can change and what they do:

adjustment_1: name it: “Camera Refocus Blur Effect” - Can be on or off, on: the adjustment layer is visible, off: not visible.
img_4 : name it: "image 4" - The user can upload an image file.
txt_4 : name it: "text 4" - The user can change the text (maximum length: 15 characters)
img_3 or video_1.mp4 : name it: "media 3" - The user can upload a video or image file. If it's a video, "img_3" becomes invisible, and if it's an image, "video_1" becomes invisible.
txt_3 : name it: "text 3" - The user can change the text (maximum length: 15 characters)
img_2 : name it: "image 2" - The user can upload an image file.
txt_2 : name it: "text 2" - The user can change the text (maximum length: 15 characters)
img_1 : name it: "image 1" - The user can upload an image file.
txt_1 : name it: "text 1" - The user can change the text (maximum length: 15 characters)
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_4:

main_comp
├── adjustment_1
├── null_3
├── null_2
├── camera_1
├── shape_9
├── nested_sequence_2
│ ├── shape_8
│ ├── img_6 (512x512)
│ ├── img_5 (512x512)
│ ├── txt_6
│ ├── shape_7
│ ├── txt_5
│ ├── shape_6
│ ├── shape_5
│ ├── txt_4
│ ├── img_4 (512x512)
│ └── shape_4
├── txt_3
├── img_3 (512x512)
├── shape_3
├── txt_2
├── txt_1
├── null_1
├── nested_sequence_1
│ ├── img_2 (512x512)
│ ├── shape_2
│ ├── img_1 (1080x1080)
│ └── shape_1
├── background (2160x3840)
├── sfx_4
├── sfx_3
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_1 : name it: "Article name" - The user can change the text (maximum length: 15 characters)
txt_2 : name it: "Article price" - The user can change the text (maximum length: 10 characters)
img_1 : name it: "image 1" - The user can upload an image file.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_5:

main_comp
├── adjustment_1
├── img_6 (1920x1920)
├── img_5 (1920x1920)
├── null_2
├── null_1
├── camera_1
├── txt_6
├── txt_5
├── txt_4
├── txt_3
├── txt_2
├── nested_sequence_3
│ ├── shape_4
│ └── img_4 (1080x1080)
├── nested_sequence_2
│ ├── shape_3
│ └── img_3 (1080x1080)
├── nested_sequence_1
│ ├── shape_2
│ └── img_2 (1080x1080)
├── txt_1
├── img_1 (512x512)
├── img_1 (512x512)
├── shape_1
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_1 : name it: "text 1" - The user can change the text (maximum length: 35 characters)
txt_2 : name it: "website link" - The user can change the text (maximum length: 50 characters)
txt_3 : name it: "website title" - The user can change the text (maximum length: 26 characters)
txt_4 : name it: "blue website title" - The user can change the text (maximum length: 35 characters)
txt_5 : name it: "website description" - The user can change the text (maximum length: 55 characters)
img_2 : name it: "image 1" - The user can upload an image file.
img_3 : name it: "image 2" - The user can upload an image file.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_6:

main_comp
├── adjustment_2
├── null_9
├── null_8
├── camera_2
├── img_6 (1920x1920)
├── img_7 (1920x1920)
├── img_6 (1920x1920)
├── nested_sequence_2
│ ├── camera_1
│ ├── null_7
│ ├── null_6
│ ├── null_5
│ ├── img_5 (1000x1000)
│ ├── img_5 (1000x1000)
│ ├── adjustment_1
│ ├── null_4
│ ├── null_3
│ ├── nested_sequence_5
│ │ ├── shape_4
│ │ └── img_4 (1080x1080)
│ ├── nested_sequence_4
│ │ ├── shape_3
│ │ └── img_3 (1080x1080)
│ ├── nested_sequence_3
│ │ ├── shape_2
│ │ └── img_2 (1080x1080)
│ ├── null_2
│ └── shape_1
├── nested_sequence_2
│ ├── camera_1
│ ├── null_7
│ ├── null_6
│ ├── null_5
│ ├── img_5 (1000x1000)
│ ├── img_5 (1000x1000)
│ ├── adjustment_1
│ ├── null_4
│ ├── null_3
│ ├── nested_sequence_5
│ │ ├── shape_4
│ │ └── img_4 (1080x1080)
│ ├── nested_sequence_4
│ │ ├── shape_3
│ │ └── img_3 (1080x1080)
│ ├── nested_sequence_3
│ │ ├── shape_2
│ │ └── img_2 (1080x1080)
│ ├── null_2
│ └── shape_1
├── nested_sequence_2
│ ├── camera_1
│ ├── null_7
│ ├── null_6
│ ├── null_5
│ ├── img_5 (1000x1000)
│ ├── img_5 (1000x1000)
│ ├── adjustment_1
│ ├── null_4
│ ├── null_3
│ ├── nested_sequence_5
│ │ ├── shape_4
│ │ └── img_4 (1080x1080)
│ ├── nested_sequence_4
│ │ ├── shape_3
│ │ └── img_3 (1080x1080)
│ ├── nested_sequence_3
│ │ ├── shape_2
│ │ └── img_2 (1080x1080)
│ ├── null_2
│ └── shape_1
├── nested_sequence_1
│ ├── null_1
│ ├── img_1 (512x512)
│ ├── img_1 (512x512)
│ ├── img_1 (512x512)
│ ├── img_1 (512x512)
│ ├── txt_2
│ └── txt_1
├── background
├── sfx_2
└── sfx_1

In this structure, nested_sequence_2 is repeated 3 times because I had to send it backwards in the timeline, but the elements inside it are the same.

Fields the user can change and what they do:
adjustment_2: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_1 : name it: "Comment keyword for files" - The user can change the text (maximum length: 45 characters)
txt_2 : name it: "Keyword (Edikit)" - The user can change the text (maximum length: 12 characters)
img_2 : name it: "image 1" - The user can upload an image file. Apply the change to all 3 instances of nested_sequence_2.
img_3 : name it: "image 2" - The user can upload an image file. Apply the change to all 3 instances of nested_sequence_2.
img_4 : name it: "image 3" - The user can upload an image file. Apply the change to all 3 instances of nested_sequence_2.
txt_2 – "Keyword (Edikit)" : name it: "keyword color" - The user selects 2 colors. Apply them respectively to the "Start color" and "End color" fields of the Gradient Ramp effect (IT: Scala sfumatura / EN: Gradient Ramp) on txt_2.
img_1 (particles) : name it: "particles color" - The user selects 1 color. Apply it to both fields of the Tint effect (IT: Tinta / EN: Tint) on every img_1 instance inside nested_sequence_1.
img_5 (top instance in nested_sequence_2) : name it: "decoration color" - The user selects 1 color. Apply it to both fields of the Gradient Ramp effect (IT: Scala sfumatura / EN: Gradient Ramp) on the topmost img_5 in each nested_sequence_2.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_7:

main_comp
├── adjustment_1
├── null_1
├── camera_1
├── txt_5
├── nested_sequence_1
│ ├── txt_4
│ ├── txt_3
│ ├── txt_2
│ ├── txt_1
│ ├── img_5 (3840x3840)
│ ├── img_4 (3840x3840)
│ ├── img_3 (3840x3840)
│ ├── img_2 (3840x3840)
│ └── shape_1
├── img_1 (3840x3840)
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_5 : name it: "text 1" - The user can change the text (maximum length: 20 characters)
img_1 : name it: "banner color" - The user selects 2 colors. Apply them respectively to the "Start Color" and "End Color" fields of the Gradient Ramp effect (IT: Scala sfumatura / EN: Gradient Ramp) on img_1.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_8:

main_comp
├── adjustment_1
├── null_3
├── null_2
├── null_1
├── camera_3
├── camera_2
├── camera_1
├── shape_4
├── img_3 (1920x1920)
├── img_2 (1920x1920)
├── txt_4
├── txt_3
├── txt_2
├── nested_sequence_2
│ ├── txt_1
│ └── shape_3
├── nested_sequence_1
│ ├── shape_2
│ └── img_1 (780x645)
├── shape_1
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_2: name it: "Text 1" - The user can change the text (maximum length: 17 characters)
txt_3: name it: "Text 2" - The user can change the text (maximum length: 27 characters)
txt_4: name it: "price" - The user can change the text (maximum length: 8 characters)
img_1: name it: "image 1" - The user can upload an image file.
shape_3: name it: "button color" - The user selects 1 color. Apply it to the "A" field of the Change to Color effect (IT: Passa a colore / EN: Change to Color) on shape_3.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_9:

main_comp
├── adjustment_1
├── null_2
├── null_1
├── camera_1
├── nested_sequence_5
│ ├── txt_15
│ ├── txt_14
│ ├── txt_13
│ ├── shape_10
│ ├── img_5 (1080x1080)
│ └── shape_9
├── nested_sequence_4
│ ├── txt_12
│ ├── txt_11
│ ├── txt_10
│ ├── shape_8
│ ├── img_4 (1080x1080)
│ └── shape_7
├── nested_sequence_3
│ ├── txt_9
│ ├── txt_8
│ ├── txt_7
│ ├── shape_6
│ ├── img_3 (1080x1080)
│ └── shape_5
├── nested_sequence_2
│ ├── txt_6
│ ├── txt_5
│ ├── txt_4
│ ├── shape_4
│ ├── img_2 (1080x1080)
│ └── shape_3
├── nested_sequence_1
│ ├── txt_3
│ ├── txt_2
│ ├── txt_1
│ ├── shape_2
│ ├── img_1 (1080x1080)
│ └── shape_1
├── sfx_1
├── sfx_1
├── sfx_1
├── sfx_1
├── sfx_1
└── background (2160x3840)

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_1: name it: "Message 1" - The user can change the text (maximum length: 36 characters)
txt_4: name it: "Message 2" - The user can change the text (maximum length: 36 characters)
txt_7: name it: "Message 3" - The user can change the text (maximum length: 36 characters)
txt_10: name it: "Message 4" - The user can change the text (maximum length: 36 characters)
txt_13: name it: "Message 5" - The user can change the text (maximum length: 36 characters)
txt_2 / txt_5 / txt_8 / txt_11 / txt_14: name it: "Sender's name" - Single field: the user types the sender's name once and it updates all instances across every nested sequence automatically. (maximum length: 22 characters)
img_1 / img_2 / img_3 / img_4 / img_5: name it: "Sender's profile picture" - Single field: the user uploads the profile picture once and it replaces all image instances across every nested sequence automatically.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_10:

main_comp
├── adjustment_1
├── null_3
├── null_2
├── null_1
├── camera_1
├── nested_sequence_3
│ ├── shape_11
│ ├── video_3 (1176x1058)
│ ├── img_3 (1080x1000)
│ ├── txt_3
│ ├── shape_10
│ └── shape_9
├── shape_8
├── nested_sequence_2
│ ├── shape_7
│ ├── video_2 (1176x1058)
│ ├── img_2 (1080x1000)
│ ├── txt_2
│ ├── shape_6
│ └── shape_5
├── nested_sequence_1
│ ├── shape_4
│ ├── video_1 (1176x1058)
│ ├── img_1 (1080x1000)
│ ├── txt_1
│ ├── shape_3
│ └── shape_2
├── shape_1
├── background (2160x3840)
├── sfx_2
├── sfx_3
├── sfx_3
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
img_1 or video_1.mp4: name it: "media 1" - The user can upload a video or image file. If it's a video, "img_1" becomes invisible, and if it's an image, "video_1" becomes invisible.
txt_1: name it: "text 1" - The user can change the text (maximum length: 18 characters)
img_2 or video_2.mp4: name it: "media 2" - The user can upload a video or image file. If it's a video, "img_2" becomes invisible, and if it's an image, "video_2" becomes invisible.
txt_2: name it: "text 2" - The user can change the text (maximum length: 18 characters)
img_3 or video_3.mp4: name it: "media 3" - The user can upload a video or image file. If it's a video, "img_3" becomes invisible, and if it's an image, "video_3" becomes invisible.
txt_3: name it: "text 3" - The user can change the text (maximum length: 18 characters)
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_11:

main_comp
├── adjustment_1
├── null_3
├── null_2
├── camera_1
├── shape_4
├── shape_3
├── nested_sequence_4
│ ├── shape_2
│ └── video_1 (2000x1784)
├── nested_sequence_3
│ ├── img_7 (8000x8000)
│ ├── shape_1
│ └── img_6 (1080x1080)
├── txt_10
├── nested_sequence_2
│ ├── img_5 (512x512)
│ └── txt_9
├── txt_8
├── txt_7
├── nested_sequence_1
│ ├── null_1
│ ├── img_4 (512x512)
│ ├── txt_6
│ ├── img_3 (512x512)
│ ├── txt_5
│ ├── img_2 (512x512)
│ ├── txt_4
│ ├── txt_3
│ ├── txt_2
│ └── txt_1
├── img_1 (512x512)
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
video_1: name it: "video 1" - The user can upload a video file.
img_1: name it: "profile pic" - The user can upload an image file.
txt_3: name it: "text 1" - The user can change the text (maximum length: 40 characters)
txt_2: name it: "text 2" - The user can change the text (maximum length: 40 characters)
txt_6: name it: "likes" - The user can change the text (maximum length: 5 characters)
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_12:

main_comp
├── adjustment_1
├── null_1
├── camera_1
├── nested_sequence_2
│ ├── txt_5
│ ├── txt_4
│ └── shape_5
├── nested_sequence_1
│ ├── shape_4
│ ├── shape_3
│ └── img_1 (1080x1080)
├── nested_sequence_1
│ ├── shape_4
│ ├── shape_3
│ └── img_1 (1080x1080)
├── txt_3
├── txt_2
├── shape_2
├── txt_1
├── shape_1
├── background (2160x3840)
├── sfx_3.wav
├── sfx_2.wav
└── sfx_1.mp3

In this structure, nested_sequence_1 is repeated 2 times in the timeline, but the elements inside it are the same.

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_1: name it: "channel name" - The user can change the text (maximum length: 14 characters)
txt_2: name it: "username" - The user can change the text (maximum length: 22 characters)
txt_3: name it: "subscribers count" - The user can change the text (maximum length: 20 characters)
img_1: name it: "profile pic" - Single field: the user uploads the image once and it updates both nested_sequence_1 instances automatically.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_13:

main_comp
├── adjustment_1
├── null_2
├── null_1
├── camera_1
├── shape_7
├── nested_sequence_4
│ ├── txt_25
│ ├── shape_6
│ ├── img_3 (1080x1080)
│ └── shape_5
├── shape_4
├── txt_24
├── img_2 (512x879)
├── img_1 (12094x2882)
├── txt_23
├── nested_sequence_3
│ ├── txt_22
│ ├── txt_21
│ ├── txt_20
│ ├── txt_19
│ ├── txt_18
│ ├── txt_17
│ └── txt_16
├── txt_15
├── nested_sequence_2
│ ├── shape_3
│ ├── txt_14
│ ├── txt_13
│ ├── txt_12
│ ├── txt_11
│ ├── txt_10
│ ├── txt_9
│ └── txt_8
├── nested_sequence_1
│ ├── shape_2
│ ├── txt_7
│ ├── txt_6
│ ├── txt_5
│ ├── txt_4
│ ├── txt_3
│ ├── txt_2
│ └── txt_1
├── shape_1
├── background (2160x3840)
├── sfx_3
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_23: name it: "month" - The user can change the text (maximum length: 18 characters)
txt_24: name it: "year" - The user can change the text (maximum length: 18 characters)
txt_25: name it: "text 1" - The user can change the text (maximum length: 18 characters)
img_3: name it: "image 1" - The user can upload an image file.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_14:

main_comp
├── txt_1
├── txt_2
├── background (2160x3840)
├── sfx_1
└── sfx_1

Fields the user can change and what they do:
txt_1: name it: "Line 1" - The user can change the text (maximum length: 20 characters)
txt_2: name it: "Line 2" - The user can change the text (maximum length: 20 characters)
accent color: name it: "accent color" - In this animation, the text appears in blue for the first second, the user can change that color with a field named "accent color". The setting is found in both text_1 and text_2 > Animator 2 > Expression Selector > fill color (The user selects one color that applies to both text_1 and text_2).
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_15:

main_comp
├── adjustment_1
├── null_2
├── null_1
├── camera_1
├── shape_6
├── img_5 (1080x1080)
├── shape_5
├── txt_7
├── txt_6
├── txt_5
├── txt_4
├── shape_4
├── img_4 (1920x1080)
├── video_1 (1920x1080)
├── shape_3
├── img_3 (1179x2556)
├── img_3 (1179x2556)
├── img_3 (1179x2556)
├── img_3 (1179x2556)
├── img_3 (1179x2556)
├── shape_2
├── shape_1
├── img_2 (1080x1080)
├── txt_3
├── txt_2
├── txt_1
├── img_1 (1179x2556)
├── img_1 (1179x2556)
├── img_1 (1179x2556)
├── img_1 (1179x2556)
├── img_1 (1179x2556)
├── img_1 (1179x2556)
├── background (2160x3840)
├── sfx_1.mp3
├── sfx_2.mp3
└── sfx_1.mp3
Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
txt_4: name it: "text number 1" - The user can change the text (maximum length: 47 characters)
txt_5: name it: "your name 1" - The user can change the text (maximum length: 33 characters)
txt_6: name it: "username 1" - The user can change the text (maximum length: 33 characters)
txt_1: name it: "text number 2" - The user can change the text (maximum length: 47 characters)
txt_3: name it: "your name 2" - The user can change the text (maximum length: 33 characters)
txt_2: name it: "username 2" - The user can change the text (maximum length: 33 characters)
img_4 or video_1.mp4: name it: "post" - The user can upload a video or image file. If it's a video, "img_4" becomes invisible, and if it's an image, "video_1" becomes invisible.
img_5: name it: "profile pic 1" - The user can upload an image file.
img_2: name it: "profile pic 2" - The user can upload an image file.
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).

Animation_16:

main_comp
├── adjustment_1
├── null_1
├── shape_4
├── shape_3
├── shape_2
├── video_1 (1920x1080)
├── txt_4
├── txt_3
├── txt_2
├── txt_1
├── img_2 (3188x242)
├── shape_1
├── img_1 (1080x1080)
├── background (2160x3840)
├── sfx_2
└── sfx_1

Fields the user can change and what they do:
adjustment_1: name it: "Camera Refocus Blur Effect" - Can be on or off. On: the adjustment layer is visible. Off: not visible.
video_1: name it: "video" - The user can upload a video file.
img_1: name it: "profile pic" - The user can upload an image file.
txt_1: name it: "likes" - The user can change the text (maximum length: 6 characters)
txt_2: name it: "username" - The user can change the text (maximum length: 27 characters)
txt_3: name it: "views" - The user can change the text (maximum length: 10 characters)
txt_4: name it: "title" - The user can change the text (maximum length: 39 characters)
background: name it: "background" - The user can decide to remove the background (if the background gets removed, the export settings are as written in General Rules).
