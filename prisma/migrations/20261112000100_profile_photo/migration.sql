ALTER TABLE "User"
  ADD COLUMN "profilePhoto" BYTEA,
  ADD COLUMN "profilePhotoId" UUID,
  ADD CONSTRAINT "User_profile_photo_pair" CHECK (("profilePhoto" IS NULL) = ("profilePhotoId" IS NULL)),
  ADD CONSTRAINT "User_profile_photo_size" CHECK (octet_length("profilePhoto") <= 65536);
