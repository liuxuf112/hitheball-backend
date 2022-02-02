
//cookie types
//0: Increase view radius
//1: increase tag radius:
//2: invisible

const VIEW_RADIUS_COOKIE_MUL = 1.3;
const TAG_RADIUS_COOKIE_MUL = 1.3;


const cookieTypesEnum = {
    VIEW_RADIUS_COOKIE_TYPE:0,
    TAG_RADIUS_COOKIE_TYPE:1,
    INVISIBLE_COOKIE_TYPE:2,
    POSSIBLE_COOKIE_TYPES:3
}
module.exports = {
    cookieTypesEnum,
    VIEW_RADIUS_COOKIE_MUL,
    TAG_RADIUS_COOKIE_MUL
}