const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({}).select('-__v -password').populate('books')
                return userData;
            }
            throw new AuthenticationError('Please log in')
        },
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
          
            return {token, user};
        },

        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticationError('Email or password is incorrect');
            }

            const correctPass = await user.isCorrectPassword(password);

            if(!correctPass) {
                throw new AuthenticationError('Email or password is incorrect');
            }

            const token = signToken(user);
            return {token, user};
        },

        saveBook: async (parent, args, context) => {
            if (context.user){
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id }, 
                    { $push: { savedBooks: args.input }},
                    { new: true }
                );

                return updatedUser;
            }

            throw new AuthenticationError('Please log in');
        },

        removeBook: async (parent, args, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: {savedBooks: { bookId: args.bookId }}},
                    { new: true }
                );

                return updatedUser;
            }

            throw new AuthenticationError('Please log in');
        }
    }
};

module.exports = resolvers;