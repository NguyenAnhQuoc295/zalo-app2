import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const name = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("Không lấy được email từ Google"), null);
        }

        // Tìm user đã tồn tại theo googleId hoặc email
        let user = await User.findOne({
          $or: [{ googleId }, { email }],
        });

        if (user) {
          // Cập nhật googleId nếu chưa có (user đăng ký thường trước đó)
          if (!user.googleId) {
            user.googleId = googleId;
          }
          // Cập nhật avatar nếu chưa có
          if (!user.avatarUrl && avatarUrl) {
            user.avatarUrl = avatarUrl;
          }
          await user.save();
        } else {
          // Tạo user mới từ Google
          user = await User.create({
            name,
            email,
            googleId,
            avatarUrl,
            passwordHash: null,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
