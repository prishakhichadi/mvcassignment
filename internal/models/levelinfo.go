package models

import (
	"encoding/json"
	"strconv"
)

type LevelInfoMap map[string]map[string]any

func ParseLevelInfo(raw string) (LevelInfoMap, error) {
	var m LevelInfoMap
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return nil, err
	}
	return m, nil
}

func levelKey(n int) string {
	if n <= 0 {
		return "1"
	}
	return strconv.Itoa(n)
}

func (m LevelInfoMap) Float(level int, key string) float64 {
	lvl, ok := m[levelKey(level)]
	if !ok {
		return 0
	}
	v, ok := lvl[key]
	if !ok {
		return 0
	}
	switch x := v.(type) {
	case float64:
		return x
	case int:
		return float64(x)
	case int64:
		return float64(x)
	default:
		return 0
	}
}

func (m LevelInfoMap) Int(level int, key string) int {
	return int(m.Float(level, key))
}

func (m LevelInfoMap) Int64(level int, key string) int64 {
	return int64(m.Float(level, key))
}
