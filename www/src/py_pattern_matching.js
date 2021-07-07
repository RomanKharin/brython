$B.pattern_match = function(subject, pattern){
    var _b_ = $B.builtins,
        frame = $B.last($B.frames_stack),
        locals = frame[1]

    if(pattern === _b_.None || pattern === _b_.True || pattern === _b_.False){
        // test identity (not equality) for these values
        return subject === pattern
    }

    if(pattern.sequence){
        // iterate on subject and match each item in the sequence
        var it = _b_.iter(subject),
            nxt = $B.$getattr(it, '__next__')
        for(var i = 0, len = pattern.sequence.length; i < len; i++){
            try{
                var subject_item = nxt()
            }catch(err){
                if($B.is_exc(err, [_b_.StopIteration])){
                    return false
                }
                throw err
            }
            if(pattern.sequence[i].capture_starred){
                if(i < len - 1){
                    // if starred identifier is not the last item, match fails
                    return false
                }
                // consume the rest of the subject
                var rest = [subject_item].concat(_b_.list.$factory(it))
                locals[pattern.sequence[i].capture_starred] = rest
                return true
            }else{
                var m = $B.pattern_match(subject_item, pattern.sequence[i])
                if(! m){
                    return false
                }
            }
        }
        // If there are still items in subject, match fails
        try{
            nxt()
            return false
        }catch(err){
            if($B.is_exc(err, [_b_.StopIteration])){
                return true
            }
            throw err
        }
        return true
    }

    if(pattern.or){
        // If one of the alternative matches, the 'or' pattern matches
        for(var item of pattern.or){
            if($B.pattern_match(subject, item)){
                if(pattern.alias){
                    locals[pattern.alias] = subject
                }
                return true
            }
        }
        return false
    }

    if(pattern.capture){
        if(pattern.capture != '_'){
            // capture identifier in local namespace
            locals[pattern.capture] = subject
        }
        return true
    }else if(pattern.capture_starred){
        locals[pattern.capture_starred] = subject
        return true
    }else if(subject == pattern){
        return true
    }
    return false
}