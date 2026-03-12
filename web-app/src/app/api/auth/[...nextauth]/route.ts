import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Account",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "cool_user" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter both username and password.');
        }

        await dbConnect();

        // 1. Check if user already exists
        const user = await User.findOne({ username: credentials.username });

        if (!user) {
          throw new Error('No user found with that username');
        }

        // 2. Match hashed password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid username or password');
        }
        
        return { id: user._id.toString(), name: user.username };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
