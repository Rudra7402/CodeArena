const mongoose = require('mongoose');
const {Schema} = mongoose;

const problemSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    difficulty:{
        type:String,
        enum:['Easy','Medium','Hard'],
        required:true
    },
    tags:{
        type:[String],
        enum:['Array','String','LinkedList','Stack','Queue','Heap','Tree','Graph','DP','Math','Sorting','Greedy','Binary Search','Hash Table','Two Pointers','Backtracking','Bit Manipulation','Dynamic Programming','Recursion','Sliding Window','Trie','Matrix','Design','Union Find','Prefix Sum'],
        required:true
    },
    visibleTestCases:[
        {
            input:{
                type:String,
                required:true
            },
            output:{
                type:String,
                required:false
            },
            explanation:{
                type:String,
                required:true
            }
        }
    ],
    hiddenTestCases:[
        {
            input:{
                type:String,
                required:true
            },
            output:{
                type:String,
                required:false
            }
        }
    ],
    startCode:[
        {
            language:{
                type:String,
                required:true
            },
            initialCode:{
                type:String,
                required:true
            }
        }
    ],
    referenceSolution:[
        {
            language:{
                type:String,
                required:true
            },
            initialCode:{
                type:String,
                required:true
            }
        }
    ],
    problemCreator:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:'user'
    }
},{
    timestamps:true
});

const Problem = mongoose.model('problem',problemSchema);

module.exports = Problem;